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

type Destino = { id: string; chat_id: string; tipo: TipoMensaje };

async function marcarFalla(destino: Destino, entrante: MensajeEntrante): Promise<void> {
  const aviso = `No se pudo descargar ${NOMBRES[destino.tipo] ?? 'el archivo'}`;
  const { error } = await supabaseAdmin()
    .from('fg_mensajes')
    .update({ texto: entrante.texto ?? aviso, error: aviso, estado: 'ok' })
    .eq('id', destino.id);
  if (error) console.error('[media] no pude marcar la falla', { mensajeId: destino.id, codigo: error.code });
}

export async function procesarMedia(destino: Destino, entrante: MensajeEntrante): Promise<void> {
  const db = supabaseAdmin();
  try {
    if (entrante.tamano && entrante.tamano > MAX_MEDIA_BYTES) throw new Error('Archivo por encima del tope');
    const bajado = await bajarMedia(entrante.crudo);
    if (!bajado) throw new Error('Evolution no devolvió el archivo');

    const contenido = Buffer.from(bajado.base64, 'base64');
    const mime = bajado.mimetype ?? entrante.mime ?? 'application/octet-stream';
    const path = `media/${destino.chat_id}/${destino.id}`;
    const { error: errorSubida } = await db.storage.from(BUCKET).upload(path, contenido, { contentType: mime, upsert: true });
    if (errorSubida) throw new Error(`Falló la subida al bucket: ${errorSubida.name}`);

    const transcripcion = destino.tipo === 'audio' ? await transcribirAudio(contenido, mime) : null;
    const { error } = await db
      .from('fg_mensajes')
      .update({ media_path: path, media_mime: mime, media_nombre: entrante.nombreArchivo, transcripcion, estado: 'ok' })
      .eq('id', destino.id);
    if (error) throw new Error(`No pude actualizar el mensaje: ${error.code}`);
  } catch (falla) {
    console.error('[media] falló el procesamiento', { mensajeId: destino.id, ...detalleError(falla) });
    await marcarFalla(destino, entrante);
  }
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
