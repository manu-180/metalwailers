import { describe, expect, it } from 'vitest';
import type { Mensaje } from '@/lib/tipos';
import { adjuntosParaCargar, armarHistorial } from '../historial';

let n = 0;
function m(over: Partial<Mensaje>): Mensaje {
  n += 1;
  return {
    id: `m${n}`,
    chat_id: 'c',
    wa_id: null,
    autor: 'cliente',
    tipo: 'texto',
    texto: 'hola',
    transcripcion: null,
    media_path: null,
    media_mime: null,
    media_nombre: null,
    estado: 'ok',
    error: null,
    creado: '2026-11-03T12:00:00Z',
    ...over,
  };
}

const textos = (h: ReturnType<typeof armarHistorial>) =>
  h.map((x) => [x.role, (x.content as { type: string; text?: string }[]).map((b) => b.text ?? b.type)]);

describe('armarHistorial', () => {
  it('bot y humano son assistant, y junta los seguidos del mismo rol', () => {
    const h = armarHistorial([
      m({ texto: 'hola' }),
      m({ texto: 'estas?' }),
      m({ autor: 'bot', texto: 'si' }),
      m({ autor: 'humano', texto: 'soy Claudia' }),
      m({ texto: 'genial' }),
    ]);
    expect(textos(h)).toEqual([
      ['user', ['hola', 'estas?']],
      ['assistant', ['si', 'soy Claudia']],
      ['user', ['genial']],
    ]);
  });

  it('arranca siempre con user', () => {
    expect(textos(armarHistorial([m({ autor: 'bot', texto: 'x' }), m({ texto: 'y' })]))).toEqual([['user', ['y']]]);
  });

  it('saca salientes que no salieron', () => {
    const h = armarHistorial([m({}), m({ autor: 'bot', texto: 'fallo', estado: 'error' }), m({ autor: 'bot', texto: 'colgado', estado: 'enviando' })]);
    expect(h).toHaveLength(1);
  });

  it('excluye lo que se le pida', () => {
    const saludo = m({ autor: 'bot', texto: 'Hola!' });
    expect(textos(armarHistorial([m({ texto: 'info' }), saludo], { excluir: new Set([saludo.id]) }))).toEqual([['user', ['info']]]);
  });

  it('el audio del cliente va por transcripción', () => {
    const h = armarHistorial([m({ tipo: 'audio', texto: null, transcripcion: 'quiero uno grande' })]);
    expect(textos(h)).toEqual([['user', ['[Audio del cliente, transcripto] quiero uno grande']]]);
  });

  it('avisa al modelo si la transcripción falló', () => {
    const h = armarHistorial([m({ tipo: 'audio', texto: 'No se pudo descargar', transcripcion: null })]);
    expect(textos(h)[0][1][0]).toMatch(/no se pudo transcribir/i);
  });

  it('adjunta la imagen real si la tiene cargada y pone el pie', () => {
    const f = m({ tipo: 'imagen', texto: 'mira', media_path: 'p', media_mime: 'image/jpeg' });
    const h = armarHistorial([f], { adjuntos: new Map([[f.id, { base64: 'QUJD', mime: 'image/jpeg' }]]) });
    expect(h[0].content).toEqual([
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'QUJD' } },
      { type: 'text', text: 'mira' },
    ]);
  });

  it('un PDF cargado va como document', () => {
    const d = m({ tipo: 'documento', texto: null, media_path: 'p', media_mime: 'application/pdf', media_nombre: 'plano.pdf' });
    const h = armarHistorial([d], { adjuntos: new Map([[d.id, { base64: 'QUJD', mime: 'application/pdf' }]]) });
    expect(h[0].content).toEqual([
      { type: 'document', title: 'plano.pdf', source: { type: 'base64', media_type: 'application/pdf', data: 'QUJD' } },
    ]);
  });

  it('una foto sin cargar queda como nota de texto', () => {
    const h = armarHistorial([m({ tipo: 'imagen', texto: null, media_path: 'p', media_mime: 'image/jpeg' })]);
    expect(textos(h)[0][1][0]).toMatch(/foto/i);
  });

  it('el audio saliente sin texto queda como nota para no romper la alternancia', () => {
    const h = armarHistorial([m({}), m({ autor: 'bot', tipo: 'audio', texto: null, media_path: 'p' }), m({ texto: 'si' })]);
    expect(h.map((x) => x.role)).toEqual(['user', 'assistant', 'user']);
  });

  it('nunca manda un bloque de texto vacío', () => {
    const h = armarHistorial([m({ texto: '   ' }), m({ texto: 'hola' })]);
    expect(textos(h)).toEqual([['user', ['hola']]]);
  });
});

describe('adjuntosParaCargar', () => {
  it('sólo lo que está sin responder, y con tope', () => {
    const vieja = m({ tipo: 'imagen', media_path: 'p', media_mime: 'image/jpeg' });
    const r = m({ autor: 'bot', texto: 'ok' });
    const nuevas = [1, 2, 3, 4].map(() => m({ tipo: 'imagen', media_path: 'p', media_mime: 'image/png' }));
    const ids = adjuntosParaCargar([vieja, r, ...nuevas]).map((x) => x.id);
    expect(ids).toEqual(nuevas.slice(-3).map((x) => x.id));
  });

  it('ignora lo que el modelo no puede leer', () => {
    const lista = [
      m({ tipo: 'documento', media_path: 'p', media_mime: 'application/zip' }),
      m({ tipo: 'video', media_path: 'p', media_mime: 'video/mp4' }),
      m({ tipo: 'sticker', media_path: 'p', media_mime: 'image/webp' }),
      m({ tipo: 'imagen', media_path: null, media_mime: 'image/png' }),
    ];
    expect(adjuntosParaCargar(lista)).toEqual([]);
  });
});
