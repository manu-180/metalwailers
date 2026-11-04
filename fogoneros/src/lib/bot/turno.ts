import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { esErrorPermanente, pedirRespuesta } from '@/lib/anthropic';
import { enviarAudioDelBot, enviarTextoDelBot } from '@/lib/enviar';
import { detalleError } from '@/lib/evolution';
import { leerAdjunto, leerDelBucket } from '@/lib/media';
import type { Chat, Config, EntradaContexto, Mensaje, Nota } from '@/lib/tipos';
import { adjuntosParaCargar, armarHistorial, esPosterior, sinAtender, type Adjunto } from './historial';
import { armarSystem, bloqueTurno, FRASE_DE_PASE, FRASE_DE_TOPE, HERRAMIENTAS } from './prompt';
import { interpretarRespuesta } from './respuesta';
import { armarSaludo, delayHumano } from './salida';

const DEBOUNCE_MS = 7000;
const LOCK_SEGUNDOS = 120;
const LIMITE_HISTORIAL = 30;
const LIMITE_NOTAS = 40;
const ESPERA_MEDIA_MS = 30_000;
const PAUSA_MEDIA_MS = 1500;
const DELAY_AUDIO_MS = 3000;
// La función muere a los 120 s: empezar a enviar más tarde deja respuestas por la mitad.
const PLAZO_PARA_ENVIAR_MS = 80_000;
const TOPE_TURNOS_POR_HORA = 15;
const TOPE_TURNOS_POR_DIA = 500;

type Fin = 'listo' | 'otra_vez';
type Situacion = 'responde' | 'apagado' | 'sin_whatsapp';

type Turno = {
  inicioMs: number;
  puedeDescartar: boolean;
  corte: string | null;
};

class EnvioFallido extends Error {}
class PlazoVencido extends Error {}
class TurnoCortado extends Error {
  constructor(readonly situacion: Situacion) {
    super(`Turno cortado: ${situacion}`);
  }
}

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

async function ultimoDelCliente(chatId: string): Promise<{ id: string; creado: string } | null> {
  const { data, error } = await supabaseAdmin()
    .from('fg_mensajes')
    .select('id, creado')
    .eq('chat_id', chatId)
    .eq('autor', 'cliente')
    .order('creado', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`No pude leer el último mensaje: ${error.code}`);
  return data;
}

export async function programarTurno(chatId: string, mensajeId: string, inicioMs: number): Promise<void> {
  await esperar(DEBOUNCE_MS);
  const ultimo = await ultimoDelCliente(chatId);
  if (ultimo?.id !== mensajeId) return;
  await procesarChat(chatId, inicioMs);
}

export async function procesarChat(chatId: string, inicioMs = Date.now()): Promise<void> {
  const fin = await unTurno(chatId, inicioMs, true);
  if (fin === 'otra_vez') await unTurno(chatId, inicioMs, false);
}

async function actualizarChat(chatId: string, cambios: Record<string, unknown>): Promise<void> {
  const { error } = await supabaseAdmin().from('fg_chats').update(cambios).eq('id', chatId);
  if (error) console.error('[turno] no pude actualizar el chat', { chatId, codigo: error.code });
}

// Siempre con bot_activo=true en el filtro: si Claudia ya entró, la charla es de ella y
// un aviso del bot no le puede volver a prender la alerta.
async function avisarAClaudia(chatId: string, cambios: Record<string, unknown>): Promise<void> {
  const { error } = await supabaseAdmin().from('fg_chats').update(cambios).eq('id', chatId).eq('bot_activo', true);
  if (error) console.error('[turno] no pude avisarle a Claudia', { chatId, codigo: error.code });
}

function marcarAtencion(chatId: string, motivo: string): Promise<void> {
  return avisarAClaudia(chatId, { atencion: true, atencion_motivo: motivo });
}

function pasarAClaudia(chatId: string, motivo: string): Promise<void> {
  return avisarAClaudia(chatId, { atencion: true, atencion_motivo: motivo, bot_activo: false });
}

async function marcarAtendido(chatId: string, hasta: string): Promise<void> {
  const { error } = await supabaseAdmin().from('fg_chats').update({ atendido_hasta: hasta }).eq('id', chatId);
  if (error) throw new Error(`No pude marcar lo atendido: ${error.code}`);
}

async function leerEstado(chatId: string): Promise<{ config: Config; chat: Chat } | null> {
  const db = supabaseAdmin();
  const [config, chat] = await Promise.all([
    db.from('fg_config').select('*').eq('id', 1).single(),
    db.from('fg_chats').select('*').eq('id', chatId).maybeSingle(),
  ]);
  if (config.error || chat.error) throw new Error(`No pude leer el estado del turno: ${config.error?.code ?? chat.error?.code}`);
  return chat.data ? { config: config.data as Config, chat: chat.data as Chat } : null;
}

function situacionDe(config: Config, chat: Chat): Situacion {
  if (!config.bot_activo || !chat.bot_activo) return 'apagado';
  return config.wa_estado === 'conectado' ? 'responde' : 'sin_whatsapp';
}

async function exigirQueSiga(chatId: string): Promise<void> {
  const estado = await leerEstado(chatId);
  const situacion = estado ? situacionDe(estado.config, estado.chat) : 'apagado';
  if (situacion !== 'responde') throw new TurnoCortado(situacion);
}

function exigirPlazo(turno: Turno): void {
  if (Date.now() - turno.inicioMs > PLAZO_PARA_ENVIAR_MS) throw new PlazoVencido('Se venció el plazo para enviar');
}

async function enviarSiSigue(chat: Chat, texto: string): Promise<string> {
  await exigirQueSiga(chat.id);
  const envio = await enviarTextoDelBot(chat, texto, delayHumano(texto));
  if (!envio.ok) throw new EnvioFallido(`No salió una respuesta del bot: ${envio.error}`);
  return envio.id;
}

// Un audio tarda más en transcribirse que el debounce: si el cliente manda audio y
// enseguida un texto, el turno del texto tiene que esperar la transcripción.
async function esperarMediaEnCurso(chatId: string): Promise<void> {
  const limite = Date.now() + ESPERA_MEDIA_MS;
  while (Date.now() < limite) {
    const desde = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data, error } = await supabaseAdmin()
      .from('fg_mensajes')
      .select('id')
      .eq('chat_id', chatId)
      .eq('autor', 'cliente')
      .eq('estado', 'enviando')
      .gte('creado', desde)
      .limit(1);
    if (error || !data?.length) return;
    await esperar(PAUSA_MEDIA_MS);
  }
}

type Saludo = { texto: string | null; audioMandado: boolean };

async function mandarAudioDeBienvenida(config: Config, chat: Chat): Promise<boolean> {
  if (!config.audio_path) return false;
  const path = config.audio_path;
  let base64: string;
  try {
    base64 = (await leerDelBucket(path)).toString('base64');
  } catch (error) {
    console.error('[turno] no pude leer el audio de bienvenida', { chatId: chat.id, ...detalleError(error) });
    await marcarAtencion(chat.id, 'No se pudo leer el audio de bienvenida');
    return false;
  }

  await exigirQueSiga(chat.id);
  const envio = await enviarAudioDelBot(chat, { base64, path, mime: config.audio_mime, nombre: config.audio_nombre }, DELAY_AUDIO_MS);
  if (envio.ok) return true;
  await marcarAtencion(chat.id, `No salió el audio de bienvenida: ${envio.error}`);
  return false;
}

// `saludo_enviado` es sólo el reclamo: lo que salió de verdad lo dicen las filas, que se
// insertan antes de enviar. Sin fila no hubo envío, así que completar lo que falta tras
// una función muerta no puede saludar dos veces. Una fila en 'enviando' cuenta como
// enviada por la misma razón que en el historial.
async function primerContacto(config: Config, chat: Chat): Promise<Saludo | null> {
  if (chat.saludo_enviado && chat.atendido_hasta !== null) return null;

  const db = supabaseAdmin();
  if (!chat.saludo_enviado) {
    const { data, error } = await db.from('fg_chats').update({ saludo_enviado: true }).eq('id', chat.id).eq('saludo_enviado', false).select('id');
    if (error) throw new Error(`No pude marcar el saludo: ${error.code}`);
    if (!data?.length) return null;
  }

  const { data: filas, error } = await db
    .from('fg_mensajes')
    .select('tipo, texto')
    .eq('chat_id', chat.id)
    .eq('autor', 'bot')
    .neq('estado', 'error')
    .order('creado', { ascending: true })
    .limit(5);
  if (error) throw new Error(`No pude leer lo ya enviado: ${error.code}`);

  let texto = (filas ?? []).find((f) => f.tipo === 'texto')?.texto ?? null;
  if (!texto) {
    const armado = armarSaludo(config.saludo, chat.nombre);
    if (armado) {
      await enviarSiSigue(chat, armado).catch((falla) => {
        throw falla instanceof EnvioFallido ? new EnvioFallido(falla.message.replace('una respuesta del bot', 'el saludo')) : falla;
      });
      texto = armado;
    }
  }
  const audioMandado = (filas ?? []).some((f) => f.tipo === 'audio') || (await mandarAudioDeBienvenida(config, chat));
  return { texto, audioMandado };
}

async function cargarConversacion(chatId: string) {
  const db = supabaseAdmin();
  const [mensajes, contexto, notas] = await Promise.all([
    db.from('fg_mensajes').select('*').eq('chat_id', chatId).order('creado', { ascending: false }).limit(LIMITE_HISTORIAL),
    db.from('fg_contexto').select('titulo, contenido').eq('activo', true).order('orden').order('creado'),
    db.from('fg_notas').select('por_que, como').eq('activa', true).order('creado', { ascending: false }).limit(LIMITE_NOTAS),
  ]);
  const error = mensajes.error ?? contexto.error ?? notas.error;
  if (error) throw new Error(`No pude leer la conversación: ${error.code}`);
  return {
    mensajes: ((mensajes.data ?? []) as Mensaje[]).reverse(),
    contexto: (contexto.data ?? []) as Pick<EntradaContexto, 'titulo' | 'contenido'>[],
    notas: (notas.data ?? []) as Pick<Nota, 'por_que' | 'como'>[],
  };
}

async function cargarAdjuntos(mensajes: Mensaje[], atendidoHasta: string | null): Promise<Map<string, Adjunto>> {
  const adjuntos = new Map<string, Adjunto>();
  await Promise.all(
    adjuntosParaCargar(mensajes, atendidoHasta).map(async (m) => {
      const adjunto = await leerAdjunto(m.media_path!, m.media_mime!);
      if (adjunto) adjuntos.set(m.id, adjunto);
    }),
  );
  return adjuntos;
}

async function contarTurnos(desdeMs: number, chatId?: string): Promise<number> {
  let consulta = supabaseAdmin()
    .from('fg_turnos_llm')
    .select('id', { count: 'exact', head: true })
    .gte('creado', new Date(Date.now() - desdeMs).toISOString());
  if (chatId) consulta = consulta.eq('chat_id', chatId);
  const { count, error } = await consulta;
  if (error) throw new Error(`No pude contar los turnos: ${error.code}`);
  return count ?? 0;
}

async function topeAlcanzado(chatId: string): Promise<'dia' | 'chat' | null> {
  const [delDia, delChat] = await Promise.all([contarTurnos(24 * 60 * 60 * 1000), contarTurnos(60 * 60 * 1000, chatId)]);
  if (delDia >= TOPE_TURNOS_POR_DIA) return 'dia';
  return delChat >= TOPE_TURNOS_POR_HORA ? 'chat' : null;
}

async function anotarTurno(chatId: string): Promise<void> {
  const { error } = await supabaseAdmin().from('fg_turnos_llm').insert({ chat_id: chatId });
  if (error) throw new Error(`No pude anotar el turno: ${error.code}`);
}

async function responder(config: Config, chat: Chat, turno: Turno): Promise<Fin> {
  exigirPlazo(turno);
  const saludo = await primerContacto(config, chat);
  const { mensajes, contexto, notas } = await cargarConversacion(chat.id);

  const pendientes = sinAtender(mensajes, chat.atendido_hasta);
  const corte = pendientes.at(-1)?.creado;
  if (!corte) return 'listo';
  turno.corte = corte;

  const tope = await topeAlcanzado(chat.id);
  if (tope === 'dia') {
    console.error('[turno] se alcanzó el tope diario de turnos', { chatId: chat.id });
    await marcarAtencion(chat.id, 'Se alcanzó el tope diario del asistente');
    return 'listo';
  }
  if (tope === 'chat') {
    await exigirQueSiga(chat.id);
    await marcarAtendido(chat.id, corte);
    await enviarConPase(chat, [FRASE_DE_TOPE], 'Muchos mensajes seguidos');
    return 'listo';
  }

  exigirPlazo(turno);
  const adjuntos = await cargarAdjuntos(mensajes, chat.atendido_hasta);
  const historial = armarHistorial(mensajes, { atendidoHasta: chat.atendido_hasta, adjuntos });
  if (historial.at(-1)?.role !== 'user') return 'listo';

  await anotarTurno(chat.id);
  const respuesta = await pedirRespuesta({
    system: [
      ...armarSystem(contexto, notas),
      bloqueTurno({ ahora: new Date(), primerContacto: saludo !== null, saludo: saludo?.texto ?? null, audioMandado: saludo?.audioMandado ?? false }),
    ],
    messages: historial,
    tools: HERRAMIENTAS,
  });
  const { partes, pasarMotivo, fallo } = interpretarRespuesta(respuesta);

  await exigirQueSiga(chat.id);
  exigirPlazo(turno);

  if (fallo) {
    console.error('[turno] el modelo no dio una respuesta usable', { chatId: chat.id, fallo });
    await marcarAtendido(chat.id, corte);
    await pasarAClaudia(chat.id, 'El asistente no pudo responder este mensaje');
    return 'listo';
  }

  if (!pasarMotivo && turno.puedeDescartar) {
    const ultimo = await ultimoDelCliente(chat.id);
    if (ultimo && esPosterior(ultimo.creado, corte)) return 'otra_vez';
  }

  // Antes del primer envío: si la función muere a mitad de las partes, un reintento
  // repetiría lo que ya salió, y duplicar es peor que dejar una parte sin mandar.
  await marcarAtendido(chat.id, corte);

  if (pasarMotivo) await enviarConPase(chat, partes.length > 0 ? partes : [FRASE_DE_PASE], pasarMotivo);
  else for (const parte of partes) await enviarSiSigue(chat, parte);
  return 'listo';
}

// La frase sale antes de apagar el bot, porque cada envío exige que siga prendido.
async function enviarConPase(chat: Chat, partes: string[], motivo: string): Promise<void> {
  try {
    for (const parte of partes) await enviarSiSigue(chat, parte);
  } catch (falla) {
    if (falla instanceof EnvioFallido) await pasarAClaudia(chat.id, motivo);
    throw falla;
  }
  await pasarAClaudia(chat.id, motivo);
}

async function hayAlgoNuevo(chatId: string, corte: string): Promise<boolean> {
  try {
    const ultimo = await ultimoDelCliente(chatId);
    return ultimo !== null && esPosterior(ultimo.creado, corte);
  } catch {
    return true;
  }
}

async function unTurno(chatId: string, inicioMs: number, puedeDescartar: boolean): Promise<Fin> {
  const estado = await leerEstado(chatId);
  if (!estado) return 'listo';
  const { config, chat } = estado;

  const situacion = situacionDe(config, chat);
  if (situacion === 'apagado') {
    await actualizarChat(chatId, { pendiente: false, pendiente_desde: null });
    return 'listo';
  }
  // Sin WhatsApp queda pendiente: cuando reconecte, el cron responde.
  if (situacion === 'sin_whatsapp') return 'listo';

  const { data: tomado, error } = await supabaseAdmin().rpc('fg_tomar_turno', { p_chat: chatId, p_segundos: LOCK_SEGUNDOS });
  if (error) throw new Error(`No pude tomar el turno: ${error.code}`);
  if (!tomado) return 'listo';

  const turno: Turno = { inicioMs, puedeDescartar, corte: null };
  let fin: Fin = 'listo';
  let dejarPendiente = false;
  try {
    await esperarMediaEnCurso(chatId);
    fin = await responder(config, chat, turno);
  } catch (falla) {
    if (falla instanceof TurnoCortado) {
      dejarPendiente = falla.situacion === 'sin_whatsapp';
    } else if (falla instanceof EnvioFallido) {
      console.error('[turno] falló un envío', { chatId });
      await marcarAtencion(chatId, falla.message);
    } else if (esErrorPermanente(falla)) {
      console.error('[turno] error permanente', { chatId, ...detalleError(falla) });
      await marcarAtencion(chatId, 'El asistente no pudo responder este mensaje');
    } else {
      console.error('[turno] falló el turno', { chatId, ...detalleError(falla) });
      dejarPendiente = true;
    }
  } finally {
    const nuevo = turno.corte !== null && (await hayAlgoNuevo(chatId, turno.corte));
    const seguirPendiente = dejarPendiente || fin === 'otra_vez' || nuevo;
    await actualizarChat(chatId, {
      procesando_hasta: null,
      ...(seguirPendiente ? {} : { pendiente: false, pendiente_desde: null }),
    });
    if (nuevo && !dejarPendiente) fin = 'otra_vez';
  }
  return fin;
}
