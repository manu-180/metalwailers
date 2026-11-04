'use server';

import { consultarVinculacion, desvincular, estadoVinculacion, iniciarVinculacion } from '@/lib/vinculacion';
import { exigirEquipo } from '@/lib/sesion';
import type { EstadoWhatsapp } from '@/lib/tipos';
import type { Resultado } from '../acciones';

type Vinculo = { estado: EstadoWhatsapp; qr: string | null; numero: string | null };

const SIN_RESPUESTA = 'No pudimos comunicarnos con WhatsApp. Probá de nuevo en un rato.';

export async function generarQr(): Promise<Resultado<Vinculo>> {
  const sesion = await exigirEquipo();
  if (!sesion.ok) return sesion;
  try {
    const r = await iniciarVinculacion();
    return { ok: true, ...r };
  } catch {
    return { ok: false, error: SIN_RESPUESTA };
  }
}

export async function consultarQr(): Promise<Resultado<Vinculo>> {
  const sesion = await exigirEquipo();
  if (!sesion.ok) return sesion;
  try {
    const r = await consultarVinculacion();
    return { ok: true, ...r };
  } catch {
    return { ok: false, error: SIN_RESPUESTA };
  }
}

export async function revisarEstado(): Promise<Resultado<{ estado: EstadoWhatsapp; numero: string | null }>> {
  const sesion = await exigirEquipo();
  if (!sesion.ok) return sesion;
  try {
    const r = await estadoVinculacion();
    return { ok: true, ...r };
  } catch {
    return { ok: false, error: SIN_RESPUESTA };
  }
}

export async function quitarVinculo(): Promise<Resultado> {
  const sesion = await exigirEquipo();
  if (!sesion.ok) return sesion;
  try {
    await desvincular();
    return { ok: true };
  } catch {
    return { ok: false, error: SIN_RESPUESTA };
  }
}
