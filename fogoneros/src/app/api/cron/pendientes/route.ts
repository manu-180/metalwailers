import { correrCron } from '@/lib/bot/cron';
import { tokenValido } from '@/lib/bot/token';
import { detalleError } from '@/lib/evolution';

export async function GET(request: Request) {
  const inicioMs = Date.now();
  const autorizacion = request.headers.get('authorization') ?? '';
  const token = autorizacion.startsWith('Bearer ') ? autorizacion.slice(7) : null;
  if (!tokenValido(token, process.env.CRON_SECRET)) {
    return Response.json({ error: 'no autorizado' }, { status: 401 });
  }

  try {
    return Response.json({ ok: true, procesados: await correrCron(inicioMs) });
  } catch (error) {
    console.error('[cron] falló la corrida', detalleError(error));
    return Response.json({ error: 'fallo la corrida' }, { status: 500 });
  }
}
