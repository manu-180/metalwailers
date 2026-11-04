'use server';

import { z } from 'zod';
import { exigirEquipo } from '@/lib/sesion';

export type Resultado<T = object> = ({ ok: true } & T) | { ok: false; error: string };

export async function cambiarBotGeneral(activo: boolean): Promise<Resultado> {
  const valor = z.boolean().safeParse(activo);
  if (!valor.success) return { ok: false, error: 'No entendimos el pedido.' };
  const sesion = await exigirEquipo();
  if (!sesion.ok) return sesion;
  const { error } = await sesion.supabase
    .from('fg_config')
    .update({ bot_activo: valor.data, actualizado: new Date().toISOString() })
    .eq('id', 1);
  if (error) return { ok: false, error: 'No pudimos cambiarlo. Probá de nuevo.' };
  return { ok: true };
}
