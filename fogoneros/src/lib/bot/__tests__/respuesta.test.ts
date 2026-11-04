import { describe, expect, it } from 'vitest';
import { interpretarRespuesta } from '../respuesta';

describe('interpretarRespuesta', () => {
  it('saca el texto e ignora thinking', () => {
    const r = interpretarRespuesta({
      stop_reason: 'end_turn',
      content: [
        { type: 'thinking' },
        { type: 'text', text: 'Para donde lo queres?' },
      ],
    });
    expect(r).toEqual({ partes: ['Para donde lo queres?'], pasarMotivo: null, fallo: null });
  });

  it('toma pasar_a_claudia con su motivo', () => {
    const r = interpretarRespuesta({
      stop_reason: 'tool_use',
      content: [
        { type: 'text', text: 'Eso te lo confirma Claudia, ya te escribe' },
        { type: 'tool_use', name: 'pasar_a_claudia', input: { motivo: 'pide precio' } },
      ],
    });
    expect(r).toEqual({ partes: ['Eso te lo confirma Claudia, ya te escribe'], pasarMotivo: 'pide precio', fallo: null });
  });

  it('una tool con motivo vacío igual pasa', () => {
    const r = interpretarRespuesta({ stop_reason: 'tool_use', content: [{ type: 'tool_use', name: 'pasar_a_claudia', input: {} }] });
    expect(r.pasarMotivo).toBeTruthy();
  });

  it('refusal es fallo y no manda texto', () => {
    const r = interpretarRespuesta({ stop_reason: 'refusal', content: [{ type: 'text', text: 'parcial' }] });
    expect(r).toMatchObject({ partes: [], fallo: 'rechazo' });
  });

  it('cortada por max_tokens no manda texto a medias', () => {
    const r = interpretarRespuesta({ stop_reason: 'max_tokens', content: [{ type: 'text', text: 'parcial' }] });
    expect(r).toMatchObject({ partes: [], fallo: 'cortada' });
  });

  it('SILENCIO es no responder', () => {
    expect(interpretarRespuesta({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'SILENCIO' }] }).partes).toEqual([]);
  });
});
