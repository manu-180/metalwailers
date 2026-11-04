import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Autor, Chat, TipoMensaje } from '@/lib/tipos';
import { detalleError, enviarAudio, enviarTexto, mensajeDeEnvio } from '@/lib/evolution';

const MAX_TEXTO = 4000;

type Destino = Pick<Chat, 'id' | 'jid' | 'telefono'>;

type Saliente = {
  autor: Exclude<Autor, 'cliente'>;
  tipo: TipoMensaje;
  texto?: string;
  media?: { path: string; mime: string | null; nombre: string | null };
  mandar: (numero: string) => Promise<string | null>;
};

export type ResultadoEnvio = { ok: true; id: string } | { ok: false; error: string };

// Se guarda antes de enviar: cuando vuelve el eco por el webhook, la fila ya existe y
// un mensaje propio no se puede confundir con Claudia escribiendo desde el teléfono.
export async function registrarYEnviar(chat: Destino, saliente: Saliente): Promise<ResultadoEnvio> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from('fg_mensajes')
    .insert({
      chat_id: chat.id,
      autor: saliente.autor,
      tipo: saliente.tipo,
      texto: saliente.texto ?? null,
      media_path: saliente.media?.path ?? null,
      media_mime: saliente.media?.mime ?? null,
      media_nombre: saliente.media?.nombre ?? null,
      estado: 'enviando',
    })
    .select('id')
    .single();
  if (error || !data) {
    console.error('[enviar] no pude guardar el saliente', { chatId: chat.id, codigo: error?.code });
    return { ok: false, error: 'No se pudo guardar el mensaje' };
  }

  try {
    const waId = await saliente.mandar(chat.telefono ?? chat.jid);
    const { error: errorUpdate } = await db.from('fg_mensajes').update({ wa_id: waId, estado: 'ok', error: null }).eq('id', data.id);
    if (errorUpdate) console.error('[enviar] no pude confirmar el saliente', { mensajeId: data.id, codigo: errorUpdate.code });
    return { ok: true, id: data.id };
  } catch (falla) {
    const legible = mensajeDeEnvio(falla);
    console.error('[enviar] falló el envío', { chatId: chat.id, mensajeId: data.id, ...detalleError(falla) });
    await db.from('fg_mensajes').update({ estado: 'error', error: legible }).eq('id', data.id);
    return { ok: false, error: legible };
  }
}

export function enviarTextoDelBot(chat: Destino, texto: string, delayMs: number): Promise<ResultadoEnvio> {
  return registrarYEnviar(chat, {
    autor: 'bot',
    tipo: 'texto',
    texto,
    mandar: (numero) => enviarTexto(numero, texto, delayMs),
  });
}

export function enviarAudioDelBot(
  chat: Destino,
  audio: { base64: string; path: string; mime: string | null; nombre: string | null },
  delayMs: number,
): Promise<ResultadoEnvio> {
  return registrarYEnviar(chat, {
    autor: 'bot',
    tipo: 'audio',
    media: { path: audio.path, mime: audio.mime, nombre: audio.nombre },
    mandar: (numero) => enviarAudio(numero, audio.base64, delayMs),
  });
}

export function apagarBotPorHumano() {
  return {
    bot_activo: false,
    atencion: false,
    atencion_motivo: null,
    saludo_enviado: true,
    pendiente: false,
    pendiente_desde: null,
    atendido_hasta: new Date().toISOString(),
  };
}

export async function enviarComoHumano(chatId: string, texto: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const limpio = texto.trim();
  if (!limpio) return { ok: false, error: 'El mensaje está vacío' };
  if (limpio.length > MAX_TEXTO) return { ok: false, error: 'El mensaje es demasiado largo' };

  const db = supabaseAdmin();
  const { data: chat, error } = await db.from('fg_chats').select('id, jid, telefono').eq('id', chatId).maybeSingle();
  if (error) {
    console.error('[enviar] no pude leer el chat', { chatId, codigo: error.code });
    return { ok: false, error: 'No se pudo leer el chat' };
  }
  if (!chat) return { ok: false, error: 'Ese chat ya no existe' };

  const { data: config } = await db.from('fg_config').select('wa_estado').eq('id', 1).maybeSingle();
  if (config?.wa_estado !== 'conectado') return { ok: false, error: 'WhatsApp no está conectado' };

  // Antes de enviar: si el bot está en medio de un turno, tiene que ver que Claudia ya entró.
  const { error: errorChat } = await db.from('fg_chats').update(apagarBotPorHumano()).eq('id', chatId);
  if (errorChat) {
    console.error('[enviar] no pude apagar el bot del chat', { chatId, codigo: errorChat.code });
    return { ok: false, error: 'No se pudo tomar la charla' };
  }

  const resultado = await registrarYEnviar(chat as Destino, {
    autor: 'humano',
    tipo: 'texto',
    texto: limpio,
    mandar: (numero) => enviarTexto(numero, limpio),
  });
  return resultado.ok ? { ok: true } : resultado;
}
