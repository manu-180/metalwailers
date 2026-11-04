import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { esErrorPermanente, pedirRespuesta } from '@/lib/anthropic';
import { enviarAudioDelBot, enviarTextoDelBot } from '@/lib/enviar';
import { detalleError } from '@/lib/evolution';
import { leerAdjunto, leerDelBucket } from '@/lib/media';
import type { Chat, Config, EntradaContexto, Mensaje, Nota } from '@/lib/tipos';
import { adjuntosParaCargar, armarHistorial, type Adjunto } from './historial';
import { armarSystem, bloqueTurno, FRASE_DE_PASE, HERRAMIENTAS, type DatosDelTurno } from './prompt';
import { interpretarRespuesta } from './respuesta';
import { armarSaludo, delayHumano } from './salida';

const DEBOUNCE_MS = 7000;
const LOCK_SEGUNDOS = 120;
const LIMITE_HISTORIAL = 30;
const LIMITE_NOTAS = 40;
const ESPERA_MEDIA_MS = 30_000;
const PAUSA_MEDIA_MS = 1500;
const DELAY_AUDIO_MS = 3000;
const REINTENTOS_HASTA_AVISAR_MS = 20 * 60 * 1000;

type Fin = 'listo' | 'otra_vez';

class EnvioFallido extends Error {}

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

async function ultimoDelCliente(chatId: string): Promise<{ id: string } | null> {
  const { data, error } = await supabaseAdmin()
    .from('fg_mensajes')
    .select('id')
    .eq('chat_id', chatId)
    .eq('autor', 'cliente')
    .order('creado', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`No pude leer el último mensaje: ${error.code}`);
  return data;
}

export async function programarTurno(chatId: string, mensajeId: string): Promise<void> {
  await esperar(DEBOUNCE_MS);
  const ultimo = await ultimoDelCliente(chatId);
  if (ultimo?.id !== mensajeId) return;
  await procesarChat(chatId);
}

export async function procesarChat(chatId: string): Promise<void> {
  const fin = await unTurno(chatId, true);
  if (fin === 'otra_vez') await unTurno(chatId, false);
}

async function actualizarChat(chatId: string, cambios: Record<string, unknown>): Promise<void> {
  const { error } = await supabaseAdmin().from('fg_chats').update(cambios).eq('id', chatId);
  if (error) console.error('[turno] no pude actualizar el chat', { chatId, codigo: error.code });
}

function marcarAtencion(chatId: string, motivo: string): Promise<void> {
  return actualizarChat(chatId, { atencion: true, atencion_motivo: motivo });
}

function pasarAClaudia(chatId: string, motivo: string): Promise<void> {
  return actualizarChat(chatId, { atencion: true, atencion_motivo: motivo, bot_activo: false });
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

async function puedeResponder(chatId: string): Promise<boolean> {
  const estado = await leerEstado(chatId);
  return Boolean(estado?.config.bot_activo && estado.chat.bot_activo && estado.config.wa_estado === 'conectado');
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

type Saludo = { ids: string[]; texto: string | null; audioMandado: boolean };

async function mandarAudioDeBienvenida(config: Config, chat: Chat): Promise<string | null> {
  if (!config.audio_path) return null;
  const path = config.audio_path;
  try {
    const contenido = await leerDelBucket(path);
    const envio = await enviarAudioDelBot(
      chat,
      { base64: contenido.toString('base64'), path, mime: config.audio_mime, nombre: config.audio_nombre },
      DELAY_AUDIO_MS,
    );
    if (envio.ok) return envio.id;
    await marcarAtencion(chat.id, `No salió el audio de bienvenida: ${envio.error}`);
  } catch (error) {
    console.error('[turno] no pude leer el audio de bienvenida', { chatId: chat.id, ...detalleError(error) });
    await marcarAtencion(chat.id, 'No se pudo leer el audio de bienvenida');
  }
  return null;
}

async function primerContacto(config: Config, chat: Chat): Promise<Saludo | null> {
  if (chat.saludo_enviado) return null;
  const { data, error } = await supabaseAdmin()
    .from('fg_chats')
    .update({ saludo_enviado: true })
    .eq('id', chat.id)
    .eq('saludo_enviado', false)
    .select('id');
  if (error) throw new Error(`No pude marcar el saludo: ${error.code}`);
  if (!data?.length) return null;

  const ids: string[] = [];
  const texto = armarSaludo(config.saludo, chat.nombre) || null;
  if (texto) {
    const envio = await enviarTextoDelBot(chat, texto, delayHumano(texto));
    if (!envio.ok) throw new EnvioFallido(`No salió el saludo: ${envio.error}`);
    ids.push(envio.id);
  }
  const audioId = await mandarAudioDeBienvenida(config, chat);
  if (audioId) ids.push(audioId);
  return { ids, texto, audioMandado: audioId !== null };
}

async function cargarConversacion(chatId: string) {
  const db = supabaseAdmin();
  const [mensajes, contexto, notas] = await Promise.all([
    db.from('fg_mensajes').select('*').eq('chat_id', chatId).order('creado', { ascending: false }).limit(LIMITE_HISTORIAL),
    db.from('fg_contexto').select('titulo, contenido').eq('activo', true).order('orden').order('creado'),
    db.from('fg_notas').select('respuesta, por_que, como').eq('activa', true).order('creado', { ascending: false }).limit(LIMITE_NOTAS),
  ]);
  const error = mensajes.error ?? contexto.error ?? notas.error;
  if (error) throw new Error(`No pude leer la conversación: ${error.code}`);
  return {
    mensajes: ((mensajes.data ?? []) as Mensaje[]).reverse(),
    contexto: (contexto.data ?? []) as Pick<EntradaContexto, 'titulo' | 'contenido'>[],
    notas: (notas.data ?? []) as Pick<Nota, 'respuesta' | 'por_que' | 'como'>[],
  };
}

async function cargarAdjuntos(mensajes: Mensaje[], excluir: Set<string>): Promise<Map<string, Adjunto>> {
  const adjuntos = new Map<string, Adjunto>();
  await Promise.all(
    adjuntosParaCargar(mensajes, excluir).map(async (m) => {
      const adjunto = await leerAdjunto(m.media_path!, m.media_mime!);
      if (adjunto) adjuntos.set(m.id, adjunto);
    }),
  );
  return adjuntos;
}

async function responder(config: Config, chat: Chat, corte: { id: string }, puedeDescartar: boolean): Promise<Fin> {
  const saludo = await primerContacto(config, chat);
  const { mensajes, contexto, notas } = await cargarConversacion(chat.id);

  const excluir = new Set(saludo?.ids ?? []);
  const adjuntos = await cargarAdjuntos(mensajes, excluir);
  const historial = armarHistorial(mensajes, { excluir, adjuntos });
  if (historial.at(-1)?.role !== 'user') return 'listo';

  const datos: DatosDelTurno = {
    ahora: new Date(),
    primerContacto: saludo !== null,
    saludo: saludo?.texto ?? null,
    audioMandado: saludo?.audioMandado ?? false,
  };
  const respuesta = await pedirRespuesta({
    system: [...armarSystem(contexto, notas), bloqueTurno(datos)],
    messages: historial,
    tools: HERRAMIENTAS,
  });
  const { partes, pasarMotivo, fallo } = interpretarRespuesta(respuesta);

  if (fallo) {
    console.error('[turno] el modelo no dio una respuesta usable', { chatId: chat.id, fallo });
    await pasarAClaudia(chat.id, 'El asistente no pudo responder este mensaje');
    return 'listo';
  }

  if (!pasarMotivo) {
    const ultimo = await ultimoDelCliente(chat.id);
    if (puedeDescartar && ultimo?.id !== corte.id) return 'otra_vez';
    if (!(await puedeResponder(chat.id))) return 'listo';
  }

  const salida = pasarMotivo && partes.length === 0 ? [FRASE_DE_PASE] : partes;
  if (pasarMotivo) await pasarAClaudia(chat.id, pasarMotivo);

  for (const parte of salida) {
    const envio = await enviarTextoDelBot(chat, parte, delayHumano(parte));
    if (!envio.ok) throw new EnvioFallido(`No salió una respuesta del bot: ${envio.error}`);
  }
  return 'listo';
}

async function hayAlgoNuevo(chatId: string, corteId: string): Promise<boolean> {
  try {
    return (await ultimoDelCliente(chatId))?.id !== corteId;
  } catch {
    return true;
  }
}

async function unTurno(chatId: string, puedeDescartar: boolean): Promise<Fin> {
  const estado = await leerEstado(chatId);
  if (!estado) return 'listo';
  const { config, chat } = estado;

  if (!config.bot_activo || !chat.bot_activo || config.wa_estado !== 'conectado') {
    await actualizarChat(chatId, { pendiente: false, pendiente_desde: null });
    return 'listo';
  }

  const { data: tomado, error } = await supabaseAdmin().rpc('fg_tomar_turno', { p_chat: chatId, p_segundos: LOCK_SEGUNDOS });
  if (error) throw new Error(`No pude tomar el turno: ${error.code}`);
  if (!tomado) return 'listo';

  let fin: Fin = 'listo';
  let dejarPendiente = false;
  let corte: { id: string } | null = null;
  try {
    await esperarMediaEnCurso(chatId);
    corte = await ultimoDelCliente(chatId);
    if (corte) fin = await responder(config, chat, corte, puedeDescartar);
  } catch (falla) {
    console.error('[turno] falló el turno', { chatId, ...detalleError(falla) });
    if (falla instanceof EnvioFallido) {
      await marcarAtencion(chatId, falla.message);
    } else if (esErrorPermanente(falla)) {
      await marcarAtencion(chatId, 'El asistente no pudo responder este mensaje');
    } else {
      dejarPendiente = true;
      const desde = chat.pendiente_desde ? new Date(chat.pendiente_desde).getTime() : Date.now();
      if (Date.now() - desde > REINTENTOS_HASTA_AVISAR_MS) await marcarAtencion(chatId, 'El asistente lleva un rato sin poder responder');
    }
  } finally {
    const seguirPendiente = dejarPendiente || fin === 'otra_vez' || (corte !== null && (await hayAlgoNuevo(chatId, corte.id)));
    await actualizarChat(chatId, {
      procesando_hasta: null,
      ...(seguirPendiente ? {} : { pendiente: false, pendiente_desde: null }),
    });
    if (seguirPendiente && !dejarPendiente) fin = 'otra_vez';
  }
  return fin;
}
