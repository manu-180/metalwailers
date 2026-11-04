import 'server-only';
import { detalleError } from '@/lib/evolution';

export async function transcribirAudio(audio: Buffer, mime: string | null): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    console.error('[transcribir] falta GROQ_API_KEY');
    return null;
  }
  try {
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(audio)], { type: mime ?? 'audio/ogg' }), 'audio.ogg');
    form.append('model', 'whisper-large-v3');
    form.append('language', 'es');
    form.append('response_format', 'json');
    const respuesta = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form,
      signal: AbortSignal.timeout(45_000),
    });
    if (!respuesta.ok) {
      console.error('[transcribir] Groq rechazó el audio', { status: respuesta.status });
      return null;
    }
    const cuerpo = (await respuesta.json()) as { text?: string };
    return cuerpo.text?.trim() || null;
  } catch (error) {
    console.error('[transcribir] falló', detalleError(error));
    return null;
  }
}
