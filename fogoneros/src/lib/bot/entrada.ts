import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { apagarBotPorHumano } from '@/lib/enviar';
import { detalleError } from '@/lib/evolution';
import { esMedia, procesarMedia } from '@/lib/media';
import { buscarChat, guardarEntrante, resolverChat } from './chats';
import { clasificarFromMe, type Saliente } from './fromme';
import type { MensajeEntrante } from './parseo';
import { programarTurno } from './turno';

const ESPERA_ECO_MS = 4000;
const VENTANA_ECO_MS = 2 * 60 * 1000;

export type Tarea =
  | { tipo: 'cliente'; chatId: string; mensajeId: string; m: MensajeEntrante }
  | { tipo: 'eco'; m: MensajeEntrante };

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

async function waIdConocido(waId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin().from('fg_mensajes').select('id').eq('wa_id', waId).limit(1);
  if (error) throw new Error(`No pude buscar el wa_id: ${error.code}`);
  return (data?.length ?? 0) > 0;
}

// Corre antes de responder el 200: si la base falla, Evolution reintenta el webhook y
// el mensaje no se pierde. Lo lento queda para la tarea que devuelve.
export async function registrarEntrante(m: MensajeEntrante): Promise<Tarea | null> {
  if (m.fromMe) return (await waIdConocido(m.waId)) ? null : { tipo: 'eco', m };

  const chat = await resolverChat(m);
  const mensajeId = await guardarEntrante({ chatId: chat.id, autor: 'cliente', estado: esMedia(m.tipo) ? 'enviando' : 'ok', m });
  return mensajeId ? { tipo: 'cliente', chatId: chat.id, mensajeId, m } : null;
}

async function salientesRecientes(chatId: string): Promise<Saliente[]> {
  const desde = new Date(Date.now() - VENTANA_ECO_MS).toISOString();
  const { data, error } = await supabaseAdmin()
    .from('fg_mensajes')
    .select('id, wa_id, tipo, texto')
    .eq('chat_id', chatId)
    .in('autor', ['bot', 'humano'])
    .gte('creado', desde);
  if (error) throw new Error(`No pude leer los salientes: ${error.code}`);
  return (data ?? []) as Saliente[];
}

async function atenderEco(m: MensajeEntrante): Promise<void> {
  await esperar(ESPERA_ECO_MS);
  if (await waIdConocido(m.waId)) return;

  const db = supabaseAdmin();
  const chatExistente = await buscarChat(m);
  const clase = clasificarFromMe(m, chatExistente ? await salientesRecientes(chatExistente.id) : []);
  if (clase.tipo === 'propio') {
    if (clase.faltaWaId) {
      const { error } = await db.from('fg_mensajes').update({ wa_id: m.waId }).eq('id', clase.mensajeId).is('wa_id', null);
      if (error) console.error('[entrada] no pude asignar el wa_id del eco', { mensajeId: clase.mensajeId, codigo: error.code });
    }
    return;
  }

  const chat = chatExistente ?? (await resolverChat(m));
  const { error } = await db.from('fg_chats').update(apagarBotPorHumano()).eq('id', chat.id);
  if (error) console.error('[entrada] no pude apagar el bot del chat', { chatId: chat.id, codigo: error.code });

  const media = esMedia(m.tipo);
  const mensajeId = await guardarEntrante({ chatId: chat.id, autor: 'humano', estado: media ? 'enviando' : 'ok', m });
  if (mensajeId && media) await procesarMedia({ id: mensajeId, chat_id: chat.id, tipo: m.tipo }, m);
}

async function atenderCliente(tarea: Extract<Tarea, { tipo: 'cliente' }>): Promise<void> {
  if (esMedia(tarea.m.tipo)) await procesarMedia({ id: tarea.mensajeId, chat_id: tarea.chatId, tipo: tarea.m.tipo }, tarea.m);
  await programarTurno(tarea.chatId, tarea.mensajeId);
}

export async function ejecutarTarea(tarea: Tarea): Promise<void> {
  try {
    if (tarea.tipo === 'eco') await atenderEco(tarea.m);
    else await atenderCliente(tarea);
  } catch (error) {
    console.error('[entrada] falló una tarea del webhook', { tipo: tarea.tipo, ...detalleError(error) });
  }
}
