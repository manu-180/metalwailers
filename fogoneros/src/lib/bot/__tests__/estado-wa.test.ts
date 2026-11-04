import { describe, expect, it } from 'vitest';
import { estadoDesdeEvolution, leerQr } from '../estado-wa';

describe('estadoDesdeEvolution', () => {
  it('open es conectado', () => {
    expect(estadoDesdeEvolution('open', 'sin_vincular', null)).toBe('conectado');
  });

  it('close después de desvincular no vuelve a desconectado', () => {
    expect(estadoDesdeEvolution('close', 'sin_vincular', null)).toBe('sin_vincular');
  });

  it('close de una sesión viva es desconectado', () => {
    expect(estadoDesdeEvolution('close', 'conectado', '+549')).toBe('desconectado');
    expect(estadoDesdeEvolution('refused', 'conectado', '+549')).toBe('desconectado');
  });

  it('close esperando un QR que nunca se escaneó vuelve a sin_vincular', () => {
    expect(estadoDesdeEvolution('close', 'conectando', null)).toBe('sin_vincular');
  });

  it('un connecting suelto no tumba al bot que ya estaba conectado', () => {
    expect(estadoDesdeEvolution('connecting', 'conectado', '+549')).toBe('conectado');
    expect(estadoDesdeEvolution('connecting', 'sin_vincular', null)).toBe('conectando');
  });

  it('lo desconocido no cambia nada', () => {
    expect(estadoDesdeEvolution('raro', 'conectado', '+549')).toBe('conectado');
  });
});

describe('leerQr', () => {
  it('lee qrcode.base64 del create', () => {
    expect(leerQr({ qrcode: { base64: 'data:image/png;base64,AAA' } })).toBe('data:image/png;base64,AAA');
  });

  it('lee base64 plano del connect y le pone el prefijo', () => {
    expect(leerQr({ base64: 'AAA' })).toBe('data:image/png;base64,AAA');
  });

  it('sin QR es null', () => {
    expect(leerQr({ instance: { state: 'open' } })).toBeNull();
    expect(leerQr(null)).toBeNull();
  });
});
