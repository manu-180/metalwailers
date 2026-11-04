import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Autor, Chat, EstadoMensaje } from '@/lib/tipos';
import type { MensajeEntrante } from './parseo';

function filtroDeDirecciones(m: MensajeEntrante): string {
  const filtros = [`jid.eq."${m.jid}"`];
  if (m.lid) filtros.push(`lid.eq."${m.lid}"`, `jid.eq."${m.lid}"`);
  if (m.telefono) filtros.push(`telefono.eq."${m.telefono}"`);
  return filtros.join(',');
}

export async function buscarChat(m: MensajeEntrante): Promise<Chat | null> {
  const { data, error } = await supabaseAdmin()
    .from('fg_chats')
    .select('*')
    .or(filtroDeDirecciones(m))
    .order('creado', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`No pude buscar el chat: ${error.code}`);
  return data as Chat | null;
}

function cambiosDeChat(chat: Chat, m: MensajeEntrante): Partial<Chat> {
  const cambios: Partial<Chat> = {};
  if (m.lid && !chat.lid) cambios.lid = m.lid;
  if (m.telefono && !chat.telefono) cambios.telefono = m.telefono;
  if (chat.jid.endsWith('@lid') && m.jid.endsWith('@s.whatsapp.net')) cambios.jid = m.jid;
  if (m.nombre && m.nombre !== chat.nombre) cambios.nombre = m.nombre;
  if (m.origen && !chat.origen) cambios.origen = m.origen;
  return cambios;
}

export async function resolverChat(m: MensajeEntrante): Promise<Chat> {
  const db = supabaseAdmin();
  const existente = await buscarChat(m);
  if (existente) {
    const cambios = cambiosDeChat(existente, m);
    if (Object.keys(cambios).length === 0) return existente;
    const { error } = await db.from('fg_chats').update(cambios).eq('id', existente.id);
    // Sólo datos de contacto: si otro chat ya tiene ese lid, el mensaje se guarda igual.
    if (error) console.error('[chats] no pude actualizar el chat', { chatId: existente.id, codigo: error.code });
    return { ...existente, ...(error ? {} : cambios) };
  }

  const { data, error } = await db
    .from('fg_chats')
    .insert({
      jid: m.jid,
      lid: m.lid,
      telefono: m.telefono,
      nombre: m.nombre,
      origen: m.origen,
      bot_activo: !m.fromMe,
    })
    .select('*')
    .single();
  if (!error && data) return data as Chat;

  // Dos mensajes seguidos de un chat nuevo llegan en paralelo y uno pierde la carrera.
  if (error?.code === '23505') {
    const ganador = await buscarChat(m);
    if (ganador) return ganador;
  }
  throw new Error(`No pude crear el chat: ${error?.code ?? 'sin datos'}`);
}

type NuevoMensaje = {
  chatId: string;
  autor: Autor;
  estado: EstadoMensaje;
  m: MensajeEntrante;
};

export async function guardarEntrante({ chatId, autor, estado, m }: NuevoMensaje): Promise<string | null> {
  const { data, error } = await supabaseAdmin()
    .from('fg_mensajes')
    .upsert(
      { chat_id: chatId, wa_id: m.waId, autor, tipo: m.tipo, texto: m.texto, estado, media_mime: m.mime, media_nombre: m.nombreArchivo },
      { onConflict: 'wa_id', ignoreDuplicates: true },
    )
    .select('id');
  if (error) throw new Error(`No pude guardar el mensaje: ${error.code}`);
  return data?.[0]?.id ?? null;
}
