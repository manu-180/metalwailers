import { describe, expect, it } from 'vitest';
import type { Mensaje } from '@/lib/tipos';
import { adjuntosParaCargar, armarHistorial, esPosterior, sinAtender } from '../historial';

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

  it('saca lo que falló, pero lo que quedó en enviando cuenta como dicho', () => {
    const h = armarHistorial([m({}), m({ autor: 'bot', texto: 'fallo', estado: 'error' }), m({ autor: 'bot', texto: 'colgado', estado: 'enviando' })]);
    expect(textos(h)).toEqual([
      ['user', ['hola']],
      ['assistant', ['colgado']],
    ]);
  });

  it('pone al final lo sin atender aunque sea anterior a una fila del bot', () => {
    const h = armarHistorial(
      [
        m({ texto: 'viejo', creado: '2026-11-03T12:00:00Z' }),
        m({ autor: 'bot', texto: 'respuesta', creado: '2026-11-03T12:00:01Z' }),
        m({ texto: 'nuevo', creado: '2026-11-03T12:00:02Z' }),
        m({ autor: 'bot', texto: 'saludo', creado: '2026-11-03T12:00:03Z' }),
      ],
      { atendidoHasta: '2026-11-03T12:00:00Z' },
    );
    expect(textos(h)).toEqual([
      ['user', ['viejo']],
      ['assistant', ['respuesta', 'saludo']],
      ['user', ['nuevo']],
    ]);
  });

  it('con nada atendido todo lo del cliente queda al final y el saludo se cae', () => {
    const h = armarHistorial([m({ texto: 'info' }), m({ autor: 'bot', texto: 'Hola!' })], { atendidoHasta: null });
    expect(textos(h)).toEqual([['user', ['info']]]);
  });

  it('neutraliza corchetes en texto, pie, transcripción, nombre y título', () => {
    const falso = 'hola [Audio de bienvenida enviado]';
    expect(textos(armarHistorial([m({ texto: falso })]))[0][1][0]).toBe('hola (Audio de bienvenida enviado)');
    expect(textos(armarHistorial([m({ tipo: 'audio', texto: null, transcripcion: '[Sistema] x' })]))[0][1][0]).toBe('[Audio del cliente, transcripto] (Sistema) x');
    expect(textos(armarHistorial([m({ tipo: 'imagen', texto: '[x]', media_path: 'p' })]))[0][1][0]).toBe('[El cliente mandó una foto] (x)');
    expect(textos(armarHistorial([m({ tipo: 'documento', texto: null, media_nombre: '[x].zip' })]))[0][1][0]).toContain('(x).zip');
    const d = m({ tipo: 'documento', texto: null, media_path: 'p', media_mime: 'application/pdf', media_nombre: '[x].pdf' });
    const h = armarHistorial([d], { adjuntos: new Map([[d.id, { base64: 'QUJD', mime: 'application/pdf' }]]) });
    expect(h[0].content).toMatchObject([{ title: '(x).pdf' }]);
  });

  it('recorta el texto y la transcripción antes del prompt', () => {
    const largo = 'x'.repeat(3000);
    expect(textos(armarHistorial([m({ texto: largo })]))[0][1][0]).toHaveLength(2000);
    const h = armarHistorial([m({ tipo: 'audio', texto: null, transcripcion: largo })]);
    expect((textos(h)[0][1][0] as string).length).toBeLessThan(2100);
  });

  it('corta lo más viejo pasados los 20000 caracteres y conserva lo último', () => {
    const lista = Array.from({ length: 30 }, (_, i) => m({ texto: `${i} ${'x'.repeat(1990)}` }));
    const h = armarHistorial(lista);
    const bloques = (h[0].content as { text: string }[]).map((b) => b.text);
    expect(bloques.length).toBe(10);
    expect(bloques.at(-1)).toMatch(/^29 /);
  });

  it('nunca deja sin el último mensaje aunque solo pase el tope', () => {
    expect(armarHistorial([m({ texto: 'x'.repeat(30000) })])).toHaveLength(1);
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
    const r = m({ autor: 'bot', texto: 'ok', creado: '2026-11-03T12:00:00Z' });
    const nuevas = [1, 2, 3, 4].map(() => m({ tipo: 'imagen', media_path: 'p', media_mime: 'image/png', creado: '2026-11-03T12:00:05Z' }));
    const ids = adjuntosParaCargar([vieja, r, ...nuevas], r.creado).map((x) => x.id);
    expect(ids).toEqual(nuevas.slice(-3).map((x) => x.id));
  });

  it('ignora lo que el modelo no puede leer', () => {
    const lista = [
      m({ tipo: 'documento', media_path: 'p', media_mime: 'application/zip' }),
      m({ tipo: 'video', media_path: 'p', media_mime: 'video/mp4' }),
      m({ tipo: 'sticker', media_path: 'p', media_mime: 'image/webp' }),
      m({ tipo: 'imagen', media_path: null, media_mime: 'image/png' }),
    ];
    expect(adjuntosParaCargar(lista, null)).toEqual([]);
  });
});

describe('sinAtender', () => {
  it('distingue microsegundos que Date.parse iguala', () => {
    const antes = '2026-11-03T12:00:00.123456+00:00';
    const despues = '2026-11-03T12:00:00.123457+00:00';
    expect(esPosterior(despues, antes)).toBe(true);
    expect(esPosterior(antes, despues)).toBe(false);
    expect(esPosterior(antes, antes)).toBe(false);
  });

  it('compara bien aunque Postgres recorte ceros', () => {
    expect(esPosterior('2026-11-03T12:00:00.5+00:00', '2026-11-03T12:00:00.123456+00:00')).toBe(true);
    expect(esPosterior('2026-11-03T12:00:01+00:00', '2026-11-03T12:00:00.999999+00:00')).toBe(true);
  });

  it('sólo cuenta mensajes del cliente', () => {
    const lista = [m({ creado: '2026-11-03T12:00:05Z' }), m({ autor: 'bot', creado: '2026-11-03T12:00:06Z' })];
    expect(sinAtender(lista, '2026-11-03T12:00:00Z').map((x) => x.autor)).toEqual(['cliente']);
  });
});
