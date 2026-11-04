import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { BUCKET, type TipoMensaje } from '@/lib/tipos';
import type { MensajeEntrante } from '@/lib/bot/parseo';
import type { Adjunto } from '@/lib/bot/historial';
import { bajarMedia, detalleError } from '@/lib/evolution';
import { transcribirAudio } from '@/lib/transcribir';

// El tope del bucket: pedirle a Evolution algo más grande es traer el archivo a
// memoria para que el upload lo rechace igual.
const MAX_MEDIA_BYTES = 26_214_400;
const MAX_ADJUNTO_BYTES = 5 * 1024 * 1024;
const MAX_AUDIO_TRANSCRIBIR_BYTES = 16 * 1024 * 1024;
const TIMEOUT_REPARAR_MS = 20_000;
const SERVIBLES = /^(audio\/|video\/|image\/(jpeg|png|webp|gif)$|application\/pdf$)/;

const NOMBRES: Partial<Record<TipoMensaje, string>> = {
  audio: 'el audio',
  imagen: 'la foto',
  documento: 'el documento',
  video: 'el video',
  sticker: 'el sticker',
};

export function esMedia(tipo: TipoMensaje): boolean {
  return tipo in NOMBRES;
}

// El tipo lo declara quien manda el archivo. El bucket lo sirve con ese Content-Type, así
// que un HTML con su tipo real quedaría ejecutable bajo el dominio de Storage.
export function tipoParaBucket(mime: string): string {
  const base = mime.split(';')[0].trim().toLowerCase();
  return SERVIBLES.has(base) ? base : 'application/octet-stream';
}

type Destino = { id: string; chat_id: string; tipo: TipoMensaje };
type Origen = Pick<MensajeEntrante, 'crudo' | 'texto' | 'mime' | 'nombreArchivo' | 'tamano'>;

export type FilaColgada = {
  id: string;
  chat_id: string;
  wa_id: string | null;
  tipo: TipoMensaje;
  texto: string | null;
  media_mime: string | null;
  media_nombre: string | null;
};

async function marcarFalla(destino: Destino, texto: string | null): Promise<void> {
  const aviso = `No se pudo descargar ${NOMBRES[destino.tipo] ?? 'el archivo'}`;
  const { error } = await supabaseAdmin()
    .from('fg_mensajes')
    .update({ texto: texto ?? aviso, error: aviso, estado: 'ok' })
    .eq('id', destino.id);
  if (error) console.error('[media] no pude marcar la falla', { mensajeId: destino.id, codigo: error.code });
}

async function avisarAudioLargo(destino: Destino): Promise<void> {
  const { error } = await supabaseAdmin()
    .from('fg_chats')
    .update({ atencion: true, atencion_motivo: 'Mandó un audio demasiado largo para transcribir' })
    .eq('id', destino.chat_id)
    .eq('bot_activo', true);
  if (error) console.error('[media] no pude avisar del audio largo', { chatId: destino.chat_id, codigo: error.code });
}

export async function procesarMedia(destino: Destino, origen: Origen, timeoutMs?: number): Promise<void> {
  const db = supabaseAdmin();
  try {
    if (origen.tamano && origen.tamano > MAX_MEDIA_BYTES) throw new Error('Archivo por encima del tope');
    const bajado = await bajarMedia(origen.crudo, timeoutMs);
    if (!bajado) throw new Error('Evolution no devolvió el archivo');

    const contenido = Buffer.from(bajado.base64, 'base64');
    const mime = bajado.mimetype ?? origen.mime ?? 'application/octet-stream';
    const path = `media/${destino.chat_id}/${destino.id}`;
    const { error: errorSubida } = await db.storage.from(BUCKET).upload(path, contenido, { contentType: tipoParaBucket(mime), upsert: true });
    if (errorSubida) throw new Error(`Falló la subida al bucket: ${errorSubida.name}`);

    const esAudio = destino.tipo === 'audio';
    const largo = esAudio && contenido.length > MAX_AUDIO_TRANSCRIBIR_BYTES;
    const transcripcion = esAudio && !largo ? await transcribirAudio(contenido, mime) : null;
    const { error } = await db
      .from('fg_mensajes')
      .update({
        media_path: path,
        media_mime: mime,
        media_nombre: origen.nombreArchivo,
        transcripcion,
        estado: 'ok',
        ...(largo ? { error: 'Audio demasiado largo para transcribir' } : {}),
      })
      .eq('id', destino.id);
    if (error) throw new Error(`No pude actualizar el mensaje: ${error.code}`);
    if (largo) await avisarAudioLargo(destino);
  } catch (falla) {
    console.error('[media] falló el procesamiento', { mensajeId: destino.id, ...detalleError(falla) });
    await marcarFalla(destino, origen.texto);
  }
}

// El payload del webhook no se guarda, pero Evolution encuentra el mensaje en su base
// por la key. Si tampoco lo tiene, procesarMedia lo deja con el aviso.
export async function repararMedia(fila: FilaColgada): Promise<void> {
  const destino = { id: fila.id, chat_id: fila.chat_id, tipo: fila.tipo };
  if (!fila.wa_id) return marcarFalla(destino, fila.texto);
  return procesarMedia(
    destino,
    { crudo: { key: { id: fila.wa_id } }, texto: fila.texto, mime: fila.media_mime, nombreArchivo: fila.media_nombre, tamano: null },
    TIMEOUT_REPARAR_MS,
  );
}

export async function leerDelBucket(path: string): Promise<Buffer> {
  const { data, error } = await supabaseAdmin().storage.from(BUCKET).download(path);
  if (error || !data) throw new Error(`No pude bajar el archivo del bucket: ${error?.name ?? 'vacío'}`);
  return Buffer.from(await data.arrayBuffer());
}

export async function leerAdjunto(path: string, mime: string): Promise<Adjunto | null> {
  try {
    const contenido = await leerDelBucket(path);
    if (contenido.length > MAX_ADJUNTO_BYTES) return null;
    return { base64: contenido.toString('base64'), mime };
  } catch (error) {
    console.error('[media] no pude leer un adjunto', detalleError(error));
    return null;
  }
}
