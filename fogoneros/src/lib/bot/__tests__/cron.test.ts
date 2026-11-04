import { beforeEach, describe, expect, it, vi } from 'vitest';
import { crearDoble, type Doble } from './doble-supabase';

const h = vi.hoisted(() => ({
  doble: null as unknown,
  procesarChat: vi.fn(),
  refrescarEstado: vi.fn(),
  repararMedia: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({ supabaseAdmin: () => h.doble }));
vi.mock('../turno', () => ({ procesarChat: h.procesarChat }));
vi.mock('@/lib/vinculacion', () => ({ refrescarEstado: h.refrescarEstado }));
vi.mock('@/lib/media', () => ({ repararMedia: h.repararMedia }));

import { correrCron } from '../cron';

let d: Doble;
const hace = (ms: number) => new Date(Date.now() - ms).toISOString();

beforeEach(() => {
  vi.clearAllMocks();
  d = crearDoble();
  h.doble = d;
  h.refrescarEstado.mockResolvedValue(undefined);
  h.procesarChat.mockResolvedValue(undefined);
  h.repararMedia.mockResolvedValue(undefined);
});

describe('correrCron', () => {
  it('procesa hasta 5 pendientes viejos, los más antiguos primero', async () => {
    for (let i = 0; i < 7; i++) d.chat({ pendiente: true, pendiente_desde: hace(200_000 + i * 1000) });
    await correrCron(Date.now());
    expect(h.procesarChat).toHaveBeenCalledTimes(5);
    expect(h.procesarChat.mock.calls[0][0]).toBe('chat-7');
  });

  it('no toca lo recién entrado', async () => {
    d.chat({ pendiente: true, pendiente_desde: hace(10_000) });
    await correrCron(Date.now());
    expect(h.procesarChat).not.toHaveBeenCalled();
  });

  it('marca atencion en todo lo que lleva más de 20 minutos, sin tope', async () => {
    const viejos = Array.from({ length: 8 }, () => d.chat({ pendiente: true, pendiente_desde: hace(21 * 60_000) }));
    const nuevo = d.chat({ pendiente: true, pendiente_desde: hace(5 * 60_000) });
    await correrCron(Date.now());
    expect(viejos.every((c) => c.atencion === true && Boolean(c.atencion_motivo))).toBe(true);
    expect(nuevo.atencion).toBe(false);
  });

  it('no pisa el motivo de un chat que ya estaba en atencion ni toca uno apagado', async () => {
    const conMotivo = d.chat({ pendiente: true, pendiente_desde: hace(21 * 60_000), atencion: true, atencion_motivo: 'pide precio' });
    const apagado = d.chat({ pendiente: true, pendiente_desde: hace(21 * 60_000), bot_activo: false });
    await correrCron(Date.now());
    expect(conMotivo.atencion_motivo).toBe('pide precio');
    expect(apagado.atencion).toBe(false);
  });

  it('repara media colgada de más de 2 minutos, con tope por corrida', async () => {
    const chat = d.chat();
    for (let i = 0; i < 5; i++) d.mensaje(chat.id as string, { tipo: 'audio', estado: 'enviando', creado: hace(3 * 60_000) });
    d.mensaje(chat.id as string, { tipo: 'audio', estado: 'enviando', creado: hace(30_000) });
    await correrCron(Date.now());
    expect(h.repararMedia).toHaveBeenCalledTimes(3);
  });

  it('no repara salientes en enviando', async () => {
    const chat = d.chat();
    d.mensaje(chat.id as string, { autor: 'bot', estado: 'enviando', creado: hace(3 * 60_000) });
    await correrCron(Date.now());
    expect(h.repararMedia).not.toHaveBeenCalled();
  });

  it('una falla refrescando el estado no frena el resto', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    h.refrescarEstado.mockRejectedValue(new Error('x'));
    d.chat({ pendiente: true, pendiente_desde: hace(200_000) });
    await correrCron(Date.now());
    expect(h.procesarChat).toHaveBeenCalledTimes(1);
    error.mockRestore();
  });
});
