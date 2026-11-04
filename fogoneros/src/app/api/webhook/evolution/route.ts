import { after } from 'next/server';
import { detalleError } from '@/lib/evolution';
import { ejecutarTarea, registrarEntrante, type Tarea } from '@/lib/bot/entrada';
import { interpretarEvento } from '@/lib/bot/parseo';
import { tokenValido } from '@/lib/bot/token';
import { aplicarEstadoDelWebhook } from '@/lib/vinculacion';

export async function POST(request: Request) {
  const secreto = process.env.WEBHOOK_SECRET;
  const porQuery = new URL(request.url).searchParams.get('t');
  if (!tokenValido(request.headers.get('x-fg-token'), secreto) && !tokenValido(porQuery, secreto)) {
    return Response.json({ error: 'no autorizado' }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  if (body === null) return Response.json({ error: 'cuerpo inválido' }, { status: 400 });

  const evento = interpretarEvento(body, process.env.EVOLUTION_INSTANCE ?? '', Date.now());
  try {
    if (evento.tipo === 'conexion') {
      await aplicarEstadoDelWebhook(evento.estado, evento.numero);
    } else if (evento.tipo === 'mensajes') {
      const tareas: Tarea[] = [];
      for (const mensaje of evento.mensajes) {
        const tarea = await registrarEntrante(mensaje);
        if (tarea) tareas.push(tarea);
      }
      if (tareas.length > 0) after(() => Promise.all(tareas.map(ejecutarTarea)));
    }
  } catch (error) {
    // Un 500 hace que Evolution reintente, y guardar es idempotente por wa_id.
    console.error('[webhook] no pude registrar el evento', detalleError(error));
    return Response.json({ error: 'reintentar' }, { status: 500 });
  }
  return Response.json({ ok: true });
}
