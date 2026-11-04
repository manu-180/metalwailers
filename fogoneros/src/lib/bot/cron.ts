import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { detalleError } from '@/lib/evolution';
import { repararMedia, type FilaColgada } from '@/lib/media';
import { refrescarEstado } from '@/lib/vinculacion';
import { procesarChat } from './turno';

const TOPE_POR_CORRIDA = 5;
const TOPE_MEDIA_POR_CORRIDA = 3;
const ANTIGUEDAD_MS = 90_000;
const MEDIA_COLGADA_MS = 2 * 60 * 1000;
const SIN_RESPUESTA_MS = 20 * 60 * 1000;
const MOTIVO_SIN_RESPUESTA = 'Lleva más de 20 minutos sin respuesta del asistente';

const antes = (ms: number) => new Date(Date.now() - ms).toISOString();

async function avisarDemorados(): Promise<void> {
  const { error } = await supabaseAdmin()
    .from('fg_chats')
    .update({ atencion: true, atencion_motivo: MOTIVO_SIN_RESPUESTA })
    .eq('pendiente', true)
    .eq('bot_activo', true)
    .eq('atencion', false)
    .lt('pendiente_desde', antes(SIN_RESPUESTA_MS));
  if (error) console.error('[cron] no pude marcar los demorados', { codigo: error.code });
}

async function repararColgadas(): Promise<void> {
  const { data, error } = await supabaseAdmin()
    .from('fg_mensajes')
    .select('id, chat_id, wa_id, tipo, texto, media_mime, media_nombre')
    .eq('autor', 'cliente')
    .eq('estado', 'enviando')
    .lt('creado', antes(MEDIA_COLGADA_MS))
    .order('creado', { ascending: true })
    .limit(TOPE_MEDIA_POR_CORRIDA);
  if (error) {
    console.error('[cron] no pude leer la media colgada', { codigo: error.code });
    return;
  }
  await Promise.allSettled(((data ?? []) as FilaColgada[]).map(repararMedia));
}

export async function correrCron(inicioMs: number): Promise<number> {
  // Primero el estado, para que los turnos de abajo vean si hay WhatsApp.
  await refrescarEstado().catch((error) => console.error('[cron] no pude refrescar el estado', detalleError(error)));
  await avisarDemorados();
  await repararColgadas();

  const { data, error } = await supabaseAdmin()
    .from('fg_chats')
    .select('id')
    .eq('pendiente', true)
    .lt('pendiente_desde', antes(ANTIGUEDAD_MS))
    .order('pendiente_desde', { ascending: true })
    .limit(TOPE_POR_CORRIDA);
  if (error) throw new Error(`No pude leer los pendientes: ${error.code}`);

  const resultados = await Promise.allSettled((data ?? []).map((chat) => procesarChat(chat.id, inicioMs)));
  resultados.forEach((resultado, i) => {
    if (resultado.status === 'rejected') console.error('[cron] falló un chat', { chatId: data?.[i].id, ...detalleError(resultado.reason) });
  });
  return resultados.length;
}
