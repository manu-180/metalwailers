'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { enviarComoHumano } from '@/lib/enviar';
import { firmarMedia, leerChats, leerMensajes, type ChatVista, type MensajeVista, type NotaVista, type UrlsFirmadas } from '@/lib/queries';
import { exigirEquipo } from '@/lib/sesion';
import type { Resultado } from '../acciones';

const Id = z.uuid();
const Fecha = z.iso.datetime({ offset: true });

const MAL_ID = { ok: false as const, error: 'No encontramos ese chat.' };

export async function masChats(antesDe: string, soloAtencion: boolean): Promise<Resultado<{ chats: ChatVista[] }>> {
  const fecha = Fecha.safeParse(antesDe);
  if (!fecha.success) return { ok: false, error: 'No pudimos traer más chats.' };
  const sesion = await exigirEquipo();
  if (!sesion.ok) return sesion;
  try {
    return { ok: true, chats: await leerChats(fecha.data, soloAtencion === true) };
  } catch {
    return { ok: false, error: 'No pudimos traer más chats. Probá de nuevo.' };
  }
}

export async function chatsRecientes(): Promise<Resultado<{ chats: ChatVista[] }>> {
  const sesion = await exigirEquipo();
  if (!sesion.ok) return sesion;
  try {
    const [todos, atencion] = await Promise.all([leerChats(), leerChats(null, true)]);
    return { ok: true, chats: [...todos, ...atencion] };
  } catch {
    return { ok: false, error: 'No pudimos actualizar los chats.' };
  }
}

export async function mensajesDelChat(
  chatId: string,
  antesDe: string | null,
): Promise<Resultado<{ mensajes: MensajeVista[]; urls: UrlsFirmadas }>> {
  const id = Id.safeParse(chatId);
  const fecha = Fecha.nullable().safeParse(antesDe);
  if (!id.success || !fecha.success) return MAL_ID;
  const sesion = await exigirEquipo();
  if (!sesion.ok) return sesion;
  try {
    const mensajes = await leerMensajes(id.data, fecha.data);
    return { ok: true, mensajes, urls: await firmarMedia(mensajes) };
  } catch {
    return { ok: false, error: 'No pudimos traer los mensajes. Probá de nuevo.' };
  }
}

export async function urlsDeMensajes(ids: string[]): Promise<Resultado<{ urls: UrlsFirmadas }>> {
  const validos = z.array(Id).max(60).safeParse(ids);
  if (!validos.success) return { ok: false, error: 'No pudimos abrir el archivo.' };
  const sesion = await exigirEquipo();
  if (!sesion.ok) return sesion;
  const { data, error } = await sesion.supabase.from('fg_mensajes').select('media_path, tipo').in('id', validos.data);
  if (error) return { ok: false, error: 'No pudimos abrir el archivo.' };
  return { ok: true, urls: await firmarMedia(data ?? []) };
}

async function actualizarChat(chatId: string, campos: Record<string, unknown>): Promise<Resultado> {
  const id = Id.safeParse(chatId);
  if (!id.success) return MAL_ID;
  const sesion = await exigirEquipo();
  if (!sesion.ok) return sesion;
  const { error } = await sesion.supabase.from('fg_chats').update(campos).eq('id', id.data);
  if (error) return { ok: false, error: 'No pudimos guardar el cambio. Probá de nuevo.' };
  return { ok: true };
}

export async function marcarLeido(chatId: string) {
  return actualizarChat(chatId, { no_leidos: 0 });
}

export async function cambiarBotDelChat(chatId: string, activo: boolean) {
  const valor = z.boolean().safeParse(activo);
  if (!valor.success) return { ok: false as const, error: 'No entendimos el pedido.' };
  return actualizarChat(chatId, { bot_activo: valor.data });
}

export async function marcarAtendido(chatId: string) {
  return actualizarChat(chatId, { atencion: false, atencion_motivo: null });
}

export async function enviarMensaje(chatId: string, texto: string): Promise<Resultado> {
  const datos = z
    .object({ chatId: Id, texto: z.string().trim().min(1).max(4000) })
    .safeParse({ chatId, texto });
  if (!datos.success) return { ok: false, error: 'Escribí un mensaje de hasta 4000 letras.' };
  const sesion = await exigirEquipo();
  if (!sesion.ok) return sesion;
  try {
    const r = await enviarComoHumano(datos.data.chatId, datos.data.texto);
    return r.ok ? { ok: true } : { ok: false, error: r.error };
  } catch {
    return { ok: false, error: 'No se pudo enviar. Revisá que el WhatsApp esté conectado.' };
  }
}

const NotaEntrada = z.object({
  mensajeId: Id,
  porQue: z
    .string()
    .trim()
    .min(1, 'Contale qué no te gustó de la respuesta.')
    .max(1500, 'Dejalo en menos de 1500 letras.'),
  como: z.string().trim().max(2000, 'Dejalo en menos de 2000 letras.'),
});

export async function guardarNota(mensajeId: string, porQue: string, como: string): Promise<Resultado<{ nota: NotaVista }>> {
  const datos = NotaEntrada.safeParse({ mensajeId, porQue, como });
  if (!datos.success) return { ok: false, error: datos.error.issues[0]?.message ?? 'Revisá lo que escribiste.' };
  const sesion = await exigirEquipo();
  if (!sesion.ok) return sesion;
  const { supabase, nombre } = sesion;

  // La copia de la respuesta y el chat salen de la base: si vinieran del navegador,
  // una nota podría enseñarle al bot algo que nunca dijo.
  const { data: mensaje, error: errorMensaje } = await supabase
    .from('fg_mensajes')
    .select('id,chat_id,autor,texto,transcripcion')
    .eq('id', datos.data.mensajeId)
    .maybeSingle();
  if (errorMensaje || !mensaje) return { ok: false, error: 'No encontramos ese mensaje.' };
  if (mensaje.autor !== 'bot') return { ok: false, error: 'Sólo se pueden corregir respuestas del bot.' };
  const respuesta = ((mensaje.texto ?? mensaje.transcripcion ?? '') as string).trim().slice(0, 4000);
  if (!respuesta) return { ok: false, error: 'Ese mensaje no tiene texto para corregir.' };

  const { data: nota, error } = await supabase
    .from('fg_notas')
    .insert({
      mensaje_id: mensaje.id,
      chat_id: mensaje.chat_id,
      respuesta,
      por_que: datos.data.porQue,
      como: datos.data.como || null,
      autor: nombre,
    })
    .select('id,mensaje_id,chat_id,respuesta,por_que,como,activa,autor,creado')
    .single();
  if (error || !nota) return { ok: false, error: 'No pudimos guardar la nota. Probá de nuevo.' };

  revalidatePath('/contexto');
  return { ok: true, nota: nota as NotaVista };
}

export async function desactivarNota(notaId: string): Promise<Resultado> {
  const id = Id.safeParse(notaId);
  if (!id.success) return { ok: false, error: 'No encontramos esa nota.' };
  const sesion = await exigirEquipo();
  if (!sesion.ok) return sesion;
  const { error } = await sesion.supabase
    .from('fg_notas')
    .update({ activa: false, desactivada: new Date().toISOString() })
    .eq('id', id.data);
  if (error) return { ok: false, error: 'No pudimos sacarla. Probá de nuevo.' };
  return { ok: true };
}
