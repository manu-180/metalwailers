import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { apagarBotPorHumano } from '@/lib/enviar';
import { detalleError } from '@/lib/evolution';
import { esMedia, procesarMedia } from '@/lib/media';
import type { Chat, Config, TipoMensaje } from '@/lib/tipos';
import { guardarEntrante, resolverChat } from './chats';
import type { MensajeEntrante } from './parseo';
import { programarTurno } from './turno';

const VENTANA_SINCRONIZACION_MS = 5 * 60 * 1000;
const MOTIVO_ATRASADO = 'Llegó mientras el WhatsApp estaba cortado';

type Media = { id: string; chat_id: string; tipo: TipoMensaje };

export type Tarea =
  | { tipo: 'cliente'; chatId: string; mensajeId: string; inicioMs: number; m: MensajeEntrante }
  | { tipo: 'media'; destino: Media; m: MensajeEntrante };

async function waIdConocido(waId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin().from('fg_mensajes').select('id').eq('wa_id', waId).limit(1);
  if (error) throw new Error(`No pude buscar el wa_id: ${error.code}`);
  return (data?.length ?? 0) > 0;
}

// Evolution 2.3.7 corre Baileys con emitOwnEvents en false: lo que manda el bot nunca
// vuelve por este camino. Un fromMe con wa_id desconocido sólo puede ser Claudia.
async function registrarDeClaudia(m: MensajeEntrante): Promise<Tarea | null> {
  if (await waIdConocido(m.waId)) return null;

  const chat = await resolverChat(m);
  const { error } = await supabaseAdmin().from('fg_chats').update(apagarBotPorHumano()).eq('id', chat.id);
  if (error) throw new Error(`No pude apagar el bot del chat: ${error.code}`);

  const media = esMedia(m.tipo);
  const mensajeId = await guardarEntrante({ chatId: chat.id, autor: 'humano', estado: media ? 'enviando' : 'ok', m });
  return mensajeId && media ? { tipo: 'media', destino: { id: mensajeId, chat_id: chat.id, tipo: m.tipo }, m } : null;
}

async function esSincronizacionInicial(): Promise<boolean> {
  const { data, error } = await supabaseAdmin().from('fg_config').select('wa_estado, vinculado_at').eq('id', 1).single();
  if (error || !data) throw new Error(`No pude leer la vinculación: ${error?.code}`);
  const { wa_estado, vinculado_at } = data as Pick<Config, 'wa_estado' | 'vinculado_at'>;
  if (wa_estado !== 'conectado' || !vinculado_at) return true;
  return Date.now() - new Date(vinculado_at).getTime() < VENTANA_SINCRONIZACION_MS;
}

async function registrarAtrasado(m: MensajeEntrante): Promise<Tarea | null> {
  if (await esSincronizacionInicial()) return null;

  const db = supabaseAdmin();
  const chat: Chat = await resolverChat(m);
  // Primero el aviso: si esto falla Evolution reintenta, y si se guardara antes el
  // reintento vería el wa_id repetido y el aviso no llegaría nunca.
  const { error } = await db.from('fg_chats').update({ atencion: true, atencion_motivo: MOTIVO_ATRASADO }).eq('id', chat.id);
  if (error) throw new Error(`No pude marcar el atrasado: ${error.code}`);

  const media = esMedia(m.tipo);
  const mensajeId = await guardarEntrante({ chatId: chat.id, autor: 'cliente', estado: media ? 'enviando' : 'ok', m });
  if (!mensajeId) return null;

  // El trigger lo acaba de dejar pendiente, y este mensaje no tiene que disparar turno.
  if (!chat.pendiente) {
    const { error: errorPendiente } = await db.from('fg_chats').update({ pendiente: false, pendiente_desde: null }).eq('id', chat.id);
    if (errorPendiente) console.error('[entrada] no pude limpiar el pendiente', { chatId: chat.id, codigo: errorPendiente.code });
  }
  return media ? { tipo: 'media', destino: { id: mensajeId, chat_id: chat.id, tipo: m.tipo }, m } : null;
}

// Corre antes de responder el 200: si la base falla, Evolution reintenta el webhook y
// el mensaje no se pierde. Lo lento queda para la tarea que devuelve.
export async function registrarEntrante(m: MensajeEntrante, inicioMs: number): Promise<Tarea | null> {
  if (m.fromMe) return m.atrasado ? null : registrarDeClaudia(m);
  if (m.atrasado) return registrarAtrasado(m);

  const chat = await resolverChat(m);
  const mensajeId = await guardarEntrante({ chatId: chat.id, autor: 'cliente', estado: esMedia(m.tipo) ? 'enviando' : 'ok', m });
  return mensajeId ? { tipo: 'cliente', chatId: chat.id, mensajeId, inicioMs, m } : null;
}

export async function ejecutarTarea(tarea: Tarea): Promise<void> {
  try {
    if (tarea.tipo === 'media') {
      await procesarMedia(tarea.destino, tarea.m);
      return;
    }
    if (esMedia(tarea.m.tipo)) await procesarMedia({ id: tarea.mensajeId, chat_id: tarea.chatId, tipo: tarea.m.tipo }, tarea.m);
    await programarTurno(tarea.chatId, tarea.mensajeId, tarea.inicioMs);
  } catch (error) {
    console.error('[entrada] falló una tarea del webhook', { tipo: tarea.tipo, ...detalleError(error) });
  }
}
