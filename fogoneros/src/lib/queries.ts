import 'server-only';
import { supabaseServidor } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { BUCKET, type Chat, type Config, type EntradaContexto, type Mensaje, type Metricas, type Nota } from '@/lib/tipos';

export const POR_PAGINA_CHATS = 50;
export const POR_PAGINA_MENSAJES = 60;
const VIDA_URL_SEGUNDOS = 900;

const COL_CHAT = 'id,telefono,nombre,bot_activo,atencion,atencion_motivo,no_leidos,ultimo_at,ultimo_preview,ultimo_autor';
const COL_MENSAJE = 'id,chat_id,autor,tipo,texto,transcripcion,media_path,media_mime,media_nombre,estado,creado';
const COL_NOTA = 'id,mensaje_id,chat_id,respuesta,por_que,como,activa,autor,creado';
const COL_CONFIG = 'id,bot_activo,saludo,audio_path,audio_mime,audio_nombre,wa_estado,wa_numero';
const COL_CONTEXTO = 'id,titulo,contenido,orden,activo';

export type ChatVista = Pick<
  Chat,
  'id' | 'telefono' | 'nombre' | 'bot_activo' | 'atencion' | 'atencion_motivo' | 'no_leidos' | 'ultimo_at' | 'ultimo_preview' | 'ultimo_autor'
>;
export type MensajeVista = Pick<
  Mensaje,
  'id' | 'chat_id' | 'autor' | 'tipo' | 'texto' | 'transcripcion' | 'media_path' | 'media_mime' | 'media_nombre' | 'estado' | 'creado'
>;
export type NotaVista = Pick<Nota, 'id' | 'mensaje_id' | 'chat_id' | 'respuesta' | 'por_que' | 'como' | 'activa' | 'autor' | 'creado'>;
export type ConfigVista = Pick<
  Config,
  'id' | 'bot_activo' | 'saludo' | 'audio_path' | 'audio_mime' | 'audio_nombre' | 'wa_estado' | 'wa_numero'
>;
export type ContextoVista = Pick<EntradaContexto, 'id' | 'titulo' | 'contenido' | 'orden' | 'activo'>;
export type UrlsFirmadas = Record<string, string>;

function firme<T>(r: { data: T | null; error: { message: string } | null }): T {
  if (r.error || r.data === null) throw new Error(r.error?.message ?? 'Sin datos');
  return r.data;
}

export async function leerConfig() {
  const supabase = await supabaseServidor();
  return firme(await supabase.from('fg_config').select(COL_CONFIG).eq('id', 1).single()) as ConfigVista;
}

export async function leerMetricas() {
  const supabase = await supabaseServidor();
  return firme(await supabase.rpc('fg_metricas')) as Metricas;
}

export async function leerChats(antesDe?: string | null, soloAtencion = false) {
  const supabase = await supabaseServidor();
  let consulta = supabase.from('fg_chats').select(COL_CHAT).not('ultimo_at', 'is', null);
  if (soloAtencion) consulta = consulta.eq('atencion', true);
  if (antesDe) consulta = consulta.lt('ultimo_at', antesDe);
  const r = await consulta.order('ultimo_at', { ascending: false }).limit(POR_PAGINA_CHATS);
  return firme(r) as ChatVista[];
}

export async function leerChat(id: string) {
  const supabase = await supabaseServidor();
  const r = await supabase.from('fg_chats').select(COL_CHAT).eq('id', id).maybeSingle();
  if (r.error) throw new Error(r.error.message);
  return r.data as ChatVista | null;
}

export async function leerMensajes(chatId: string, antesDe?: string | null) {
  const supabase = await supabaseServidor();
  let consulta = supabase.from('fg_mensajes').select(COL_MENSAJE).eq('chat_id', chatId);
  if (antesDe) consulta = consulta.lt('creado', antesDe);
  const r = await consulta.order('creado', { ascending: false }).limit(POR_PAGINA_MENSAJES);
  return (firme(r) as MensajeVista[]).reverse();
}

export async function leerNotasDelChat(chatId: string) {
  const supabase = await supabaseServidor();
  const r = await supabase
    .from('fg_notas')
    .select(COL_NOTA)
    .eq('chat_id', chatId)
    .eq('activa', true)
    .order('creado', { ascending: true });
  return firme(r) as NotaVista[];
}

export async function leerNotasActivas() {
  const supabase = await supabaseServidor();
  const r = await supabase
    .from('fg_notas')
    .select(COL_NOTA)
    .eq('activa', true)
    .order('creado', { ascending: false })
    .limit(200);
  return firme(r) as NotaVista[];
}

export async function leerContexto() {
  const supabase = await supabaseServidor();
  const r = await supabase.from('fg_contexto').select(COL_CONTEXTO).order('orden', { ascending: true });
  return firme(r) as ContextoVista[];
}

// El bucket no tiene políticas para `authenticated`: firmar requiere service role.
// Los paths salen siempre de filas ya leídas con la sesión y su RLS, nunca del navegador.
export async function firmarRutas(rutas: (string | null | undefined)[]): Promise<UrlsFirmadas> {
  const unicas = [...new Set(rutas.filter((r): r is string => Boolean(r)))];
  if (unicas.length === 0) return {};
  const { data, error } = await supabaseAdmin().storage.from(BUCKET).createSignedUrls(unicas, VIDA_URL_SEGUNDOS);
  if (error || !data) return {};
  const urls: UrlsFirmadas = {};
  for (const f of data) if (f.path && f.signedUrl) urls[f.path] = f.signedUrl;
  return urls;
}
