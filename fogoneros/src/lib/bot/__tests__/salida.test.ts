import { describe, expect, it } from 'vitest';
import { armarSaludo, delayHumano, limpiarSalida, primerNombre } from '../salida';

describe('limpiarSalida', () => {
  it('saca ¿ y ¡ y deja el que cierra', () => {
    expect(limpiarSalida('¿Para cuantas personas? ¡Genial!')).toEqual(['Para cuantas personas? Genial!']);
  });

  it('saca markdown', () => {
    expect(limpiarSalida('**Hola** __vos__ `x`')).toEqual(['Hola vos x']);
    expect(limpiarSalida('# Titulo\n\n- uno\n- dos\n* tres\n1. cuatro')).toEqual(['Titulo', 'uno\ndos\ntres\ncuatro']);
  });

  it('corta en mensajes por línea en blanco', () => {
    expect(limpiarSalida('uno\n\ndos')).toEqual(['uno', 'dos']);
  });

  it('no pasa de 3 mensajes y no pierde lo que sobra', () => {
    expect(limpiarSalida('a\n\nb\n\nc\n\nd')).toEqual(['a', 'b', 'c d']);
  });

  it('vacío o SILENCIO es no responder', () => {
    for (const t of ['', '   \n\n ', 'SILENCIO', ' silencio. ', '**', '¿¡']) expect(limpiarSalida(t)).toEqual([]);
  });

  it('nunca manda etiquetas internas', () => {
    expect(limpiarSalida('hola\n\n<aviso_interno>x</aviso_interno>')).toEqual(['hola']);
    expect(limpiarSalida('[Audio pregrabado de bienvenida]')).toEqual([]);
    expect(limpiarSalida('uno <contexto> dos')).toEqual([]);
  });

  it('no confunde un menor que con una etiqueta', () => {
    expect(limpiarSalida('mide < 80 cm')).toEqual(['mide < 80 cm']);
  });
});

describe('primerNombre', () => {
  it.each([
    ['Juan Perez', 'Juan'],
    ['MARIA', 'Maria'],
    ['josé luis', 'José'],
    ['  Ñata  ', 'Ñata'],
  ])('%s → %s', (entrada, esperado) => {
    expect(primerNombre(entrada)).toBe(esperado);
  });

  it.each(['Ventas', 'Ventas Norte', 'Fogones SRL', 'Juan 🔥', '🔥', 'J', '1234', 'juan_77', '', null, 'Info', 'Hierros Tienda', 'Muebles y Deco'])(
    'descarta %s',
    (entrada) => {
      expect(primerNombre(entrada)).toBeNull();
    },
  );
});

describe('armarSaludo', () => {
  const plantilla = 'Hola {nombre}, como estas? Te mando un audio.';

  it('pone el primer nombre', () => {
    expect(armarSaludo(plantilla, 'Juan Perez')).toBe('Hola Juan, como estas? Te mando un audio.');
  });

  it('sin nombre usable saca el espacio', () => {
    expect(armarSaludo(plantilla, 'Ventas 🔥')).toBe('Hola, como estas? Te mando un audio.');
  });

  it('sin nombre al principio no deja una coma suelta', () => {
    expect(armarSaludo('{nombre}, hola', null)).toBe('hola');
  });
});

describe('delayHumano', () => {
  it('crece con el largo y tiene tope', () => {
    expect(delayHumano('hola')).toBeGreaterThanOrEqual(1500);
    expect(delayHumano('x'.repeat(60))).toBeGreaterThan(delayHumano('hola'));
    expect(delayHumano('x'.repeat(5000))).toBeLessThanOrEqual(6000);
  });
});
