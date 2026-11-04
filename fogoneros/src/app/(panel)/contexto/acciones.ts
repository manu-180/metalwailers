'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { firmarRutas } from '@/lib/queries';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { exigirEquipo } from '@/lib/sesion';
import { BUCKET } from '@/lib/tipos';
import type { ContextoVista } from '@/lib/queries';
import type { Resultado } from '../acciones';

const Id = z.uuid();
const NO_GUARDO = 'No pudimos guardar. Probá de nuevo.';

const EXTENSIONES: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/aac': 'aac',
  'audio/ogg': 'ogg',
  'audio/opus': 'ogg',
  'audio/webm': 'webm',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
};

export async function guardarSaludo(saludo: string): Promise<Resultado> {
  const texto = z.string().trim().min(1).max(2000).safeParse(saludo);
  if (!texto.success) return { ok: false, error: 'Escribí el mensaje, de hasta 2000 letras.' };
  const sesion = await exigirEquipo();
  if (!sesion.ok) return sesion;
  const { error } = await sesion.supabase
    .from('fg_config')
    .update({ saludo: texto.data, actualizado: new Date().toISOString() })
    .eq('id', 1);
  return error ? { ok: false, error: NO_GUARDO } : { ok: true };
}

export async function pedirSubidaAudio(mime: string): Promise<Resultado<{ path: string; token: string }>> {
  const base = typeof mime === 'string' ? mime.split(';')[0].trim().toLowerCase() : '';
  const extension = EXTENSIONES[base];
  if (!extension) return { ok: false, error: 'Ese tipo de audio no sirve. Probá con un mp3 o grabalo acá.' };
  const sesion = await exigirEquipo();
  if (!sesion.ok) return sesion;
  const path = `audio/bienvenida-${Date.now()}.${extension}`;
  const { data, error } = await supabaseAdmin().storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: 'No pudimos preparar la subida. Probá de nuevo.' };
  return { ok: true, path: data.path, token: data.token };
}

// El path vuelve del navegador: tiene que tener la forma exacta que emite pedirSubidaAudio
// y el objeto tiene que existir, o el bot saludaría con un audio que no está.
const AudioEntrada = z.object({
  path: z.string().regex(/^audio\/bienvenida-\d{13}\.(mp3|m4a|aac|ogg|webm|wav)$/),
  mime: z.string().min(1).max(100),
  nombre: z.string().trim().min(1).max(200),
});

export async function guardarAudio(entrada: unknown): Promise<Resultado<{ url: string | null }>> {
  const datos = AudioEntrada.safeParse(entrada);
  if (!datos.success) return { ok: false, error: NO_GUARDO };
  const sesion = await exigirEquipo();
  if (!sesion.ok) return sesion;
  const { path, mime, nombre } = datos.data;
  if (EXTENSIONES[mime.split(';')[0].trim().toLowerCase()] !== path.split('.').pop()) return { ok: false, error: NO_GUARDO };
  const { data: existe } = await supabaseAdmin().storage.from(BUCKET).exists(path);
  if (!existe) return { ok: false, error: NO_GUARDO };
  const { error } = await sesion.supabase
    .from('fg_config')
    .update({ audio_path: path, audio_mime: mime, audio_nombre: nombre, actualizado: new Date().toISOString() })
    .eq('id', 1);
  if (error) return { ok: false, error: NO_GUARDO };
  const urls = await firmarRutas([path]);
  return { ok: true, url: urls[path] ?? null };
}

// El archivo queda en el bucket a propósito: los chats viejos que ya lo mandaron lo siguen reproduciendo.
export async function sacarAudio(): Promise<Resultado> {
  const sesion = await exigirEquipo();
  if (!sesion.ok) return sesion;
  const { error } = await sesion.supabase
    .from('fg_config')
    .update({ audio_path: null, audio_mime: null, audio_nombre: null, actualizado: new Date().toISOString() })
    .eq('id', 1);
  return error ? { ok: false, error: 'No pudimos sacarlo. Probá de nuevo.' } : { ok: true };
}

const Entrada = z.object({
  titulo: z.string().trim().min(1, 'Ponele un título.').max(120, 'El título es muy largo.'),
  contenido: z.string().trim().max(8000, 'Dejalo en menos de 8000 letras.'),
  activo: z.boolean(),
});

export async function crearEntrada(entrada: unknown): Promise<Resultado<{ fila: ContextoVista }>> {
  const datos = Entrada.extend({ orden: z.number().int() }).safeParse(entrada);
  if (!datos.success) return { ok: false, error: datos.error.issues[0]?.message ?? NO_GUARDO };
  const sesion = await exigirEquipo();
  if (!sesion.ok) return sesion;
  const { data, error } = await sesion.supabase
    .from('fg_contexto')
    .insert(datos.data)
    .select('id,titulo,contenido,orden,activo')
    .single();
  if (error || !data) return { ok: false, error: NO_GUARDO };
  return { ok: true, fila: data as ContextoVista };
}

export async function editarEntrada(id: string, entrada: unknown): Promise<Resultado> {
  const datos = Entrada.safeParse(entrada);
  const idValido = Id.safeParse(id);
  if (!idValido.success) return { ok: false, error: NO_GUARDO };
  if (!datos.success) return { ok: false, error: datos.error.issues[0]?.message ?? NO_GUARDO };
  const sesion = await exigirEquipo();
  if (!sesion.ok) return sesion;
  const { error } = await sesion.supabase
    .from('fg_contexto')
    .update({ ...datos.data, actualizado: new Date().toISOString() })
    .eq('id', idValido.data);
  return error ? { ok: false, error: NO_GUARDO } : { ok: true };
}

export async function cambiarUsoEntrada(id: string, activo: boolean): Promise<Resultado> {
  const idValido = Id.safeParse(id);
  const valor = z.boolean().safeParse(activo);
  if (!idValido.success || !valor.success) return { ok: false, error: NO_GUARDO };
  const sesion = await exigirEquipo();
  if (!sesion.ok) return sesion;
  const { error } = await sesion.supabase
    .from('fg_contexto')
    .update({ activo: valor.data, actualizado: new Date().toISOString() })
    .eq('id', idValido.data);
  return error ? { ok: false, error: NO_GUARDO } : { ok: true };
}

export async function borrarEntrada(id: string): Promise<Resultado> {
  const idValido = Id.safeParse(id);
  if (!idValido.success) return { ok: false, error: 'No pudimos borrarlo. Probá de nuevo.' };
  const sesion = await exigirEquipo();
  if (!sesion.ok) return sesion;
  const { error } = await sesion.supabase.from('fg_contexto').delete().eq('id', idValido.data);
  if (error) return { ok: false, error: 'No pudimos borrarlo. Probá de nuevo.' };
  revalidatePath('/contexto');
  return { ok: true };
}
