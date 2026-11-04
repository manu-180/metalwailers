import { beforeEach, describe, expect, it, vi } from 'vitest';
import { crearDoble, type Doble } from '@/lib/bot/__tests__/doble-supabase';

const h = vi.hoisted(() => ({
  doble: null as unknown,
  estadoConexion: vi.fn(),
  registrarWebhook: vi.fn(),
  webhookVigente: vi.fn(),
  numeroVinculado: vi.fn(),
  conectarInstancia: vi.fn(),
  crearInstancia: vi.fn(),
  cerrarSesion: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({ supabaseAdmin: () => h.doble }));
vi.mock('@/lib/evolution', () => ({
  estadoConexion: h.estadoConexion,
  registrarWebhook: h.registrarWebhook,
  webhookVigente: h.webhookVigente,
  numeroVinculado: h.numeroVinculado,
  conectarInstancia: h.conectarInstancia,
  crearInstancia: h.crearInstancia,
  cerrarSesion: h.cerrarSesion,
  detalleError: () => ({ nombre: 'x' }),
}));

import { aplicarEstadoDelWebhook, consultarVinculacion, desvincular, iniciarVinculacion, refrescarEstado } from '../vinculacion';

let d: Doble;

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  d = crearDoble();
  h.doble = d;
  h.registrarWebhook.mockResolvedValue(undefined);
  h.webhookVigente.mockResolvedValue(true);
  h.numeroVinculado.mockResolvedValue('+5491133334444');
});

describe('webhook', () => {
  it('al vincular, un webhook que no se registra se ve como problema', async () => {
    Object.assign(d.config(), { wa_estado: 'conectando', wa_numero: null });
    h.estadoConexion.mockResolvedValue('open');
    h.registrarWebhook.mockRejectedValue(new Error('x'));
    const r = await consultarVinculacion();
    expect(r.estado).toBe('desconectado');
    expect(d.config().wa_estado).toBe('desconectado');
  });

  it('no entrega un QR si el webhook no quedó', async () => {
    Object.assign(d.config(), { wa_estado: 'sin_vincular', wa_numero: null });
    h.estadoConexion.mockResolvedValue('inexistente');
    h.crearInstancia.mockResolvedValue({ qrcode: { base64: 'AAA' } });
    h.registrarWebhook.mockRejectedValue(new Error('x'));
    expect((await iniciarVinculacion()).qr).toBeNull();
  });

  it('el cron no toca nada si el webhook está bien', async () => {
    h.estadoConexion.mockResolvedValue('open');
    await refrescarEstado();
    expect(h.registrarWebhook).not.toHaveBeenCalled();
  });

  it('el cron reasegura un webhook que cambió', async () => {
    h.estadoConexion.mockResolvedValue('open');
    h.webhookVigente.mockResolvedValue(false);
    await refrescarEstado();
    expect(h.registrarWebhook).toHaveBeenCalledTimes(1);
    expect(d.config().wa_estado).toBe('conectado');
  });

  it('si no puede reasegurarlo queda como problema', async () => {
    h.estadoConexion.mockResolvedValue('open');
    h.webhookVigente.mockResolvedValue(false);
    h.registrarWebhook.mockRejectedValue(new Error('x'));
    await refrescarEstado();
    expect(d.config().wa_estado).toBe('desconectado');
  });

  it('si la consulta del webhook falla no inventa un problema', async () => {
    h.estadoConexion.mockResolvedValue('open');
    h.webhookVigente.mockRejectedValue(new Error('x'));
    await refrescarEstado();
    expect(d.config().wa_estado).toBe('conectado');
    expect(h.registrarWebhook).not.toHaveBeenCalled();
  });

  it('el siguiente cron recupera el estado cuando el webhook vuelve', async () => {
    d.config().wa_estado = 'desconectado';
    h.estadoConexion.mockResolvedValue('open');
    await refrescarEstado();
    expect(d.config().wa_estado).toBe('conectado');
  });
});

describe('estado', () => {
  it('un close que llega después de desvincular no pisa sin_vincular', async () => {
    h.cerrarSesion.mockResolvedValue(undefined);
    const fila = d.config();
    const original = d.from.bind(d);
    let primero = true;
    d.from = ((tabla: string) => {
      const consulta = original(tabla);
      if (primero) {
        primero = false;
        // Lectura del webhook con el estado viejo, y desvincular gana en el medio.
        const then = consulta.then.bind(consulta);
        consulta.then = ((r: never) =>
          then((v: unknown) => {
            fila.wa_estado = 'sin_vincular';
            fila.wa_numero = null;
            return (r as (x: unknown) => unknown)(v);
          })) as never;
      }
      return consulta;
    }) as never;
    await aplicarEstadoDelWebhook('close', null);
    expect(fila.wa_estado).toBe('sin_vincular');
  });

  it('desvincular deja sin_vincular', async () => {
    h.cerrarSesion.mockResolvedValue(undefined);
    await desvincular();
    expect(d.config()).toMatchObject({ wa_estado: 'sin_vincular', wa_numero: null });
  });

  it('un QR nuevo sella vinculado_at', async () => {
    Object.assign(d.config(), { wa_estado: 'conectando', vinculado_at: null });
    h.estadoConexion.mockResolvedValue('open');
    await consultarVinculacion();
    expect(d.config().vinculado_at).not.toBeNull();
  });

  it('una reconexión no sella vinculado_at', async () => {
    Object.assign(d.config(), { wa_estado: 'desconectado', vinculado_at: '2026-01-01T00:00:00.000Z' });
    await aplicarEstadoDelWebhook('open', null);
    expect(d.config()).toMatchObject({ wa_estado: 'conectado', vinculado_at: '2026-01-01T00:00:00.000Z' });
  });
});
