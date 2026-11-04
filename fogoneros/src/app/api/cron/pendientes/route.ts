import { supabaseAdmin } from '@/lib/supabase/admin';
import { detalleError } from '@/lib/evolution';
import { procesarChat } from '@/lib/bot/turno';
import { tokenValido } from '@/lib/bot/token';
import { refrescarEstado } from '@/lib/vinculacion';

const TOPE_POR_CORRIDA = 5;
const ANTIGUEDAD_MS = 90_000;

export async function GET(request: Request) {
  const autorizacion = request.headers.get('authorization') ?? '';
  const token = autorizacion.startsWith('Bearer ') ? autorizacion.slice(7) : null;
  if (!tokenValido(token, process.env.CRON_SECRET)) {
    return Response.json({ error: 'no autorizado' }, { status: 401 });
  }

  // Primero el estado: el turno descarta lo pendiente si wa_estado no dice conectado.
  await refrescarEstado().catch((error) => console.error('[cron] no pude refrescar el estado', detalleError(error)));

  const limite = new Date(Date.now() - ANTIGUEDAD_MS).toISOString();
  const { data, error } = await supabaseAdmin()
    .from('fg_chats')
    .select('id')
    .eq('pendiente', true)
    .lt('pendiente_desde', limite)
    .order('pendiente_desde', { ascending: true })
    .limit(TOPE_POR_CORRIDA);
  if (error) {
    console.error('[cron] no pude leer los pendientes', { codigo: error.code });
    return Response.json({ error: 'fallo la lectura' }, { status: 500 });
  }

  const resultados = await Promise.allSettled((data ?? []).map((chat) => procesarChat(chat.id)));
  resultados.forEach((resultado, i) => {
    if (resultado.status === 'rejected') console.error('[cron] falló un chat', { chatId: data?.[i].id, ...detalleError(resultado.reason) });
  });
  return Response.json({ ok: true, procesados: resultados.length });
}
