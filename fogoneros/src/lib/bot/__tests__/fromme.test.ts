import { describe, expect, it } from 'vitest';
import { clasificarFromMe, type Saliente } from '../fromme';

const s = (over: Partial<Saliente>): Saliente => ({ id: 'm1', wa_id: null, tipo: 'texto', texto: 'hola', ...over });

describe('clasificarFromMe', () => {
  it('wa_id conocido es propio', () => {
    expect(clasificarFromMe({ waId: 'W', tipo: 'texto', texto: 'x' }, [s({ wa_id: 'W' })])).toEqual({
      tipo: 'propio',
      mensajeId: 'm1',
      faltaWaId: false,
    });
  });

  it('mismo texto en una saliente que todavía no tiene wa_id es propio', () => {
    expect(clasificarFromMe({ waId: 'W', tipo: 'texto', texto: '  hola\n' }, [s({})])).toEqual({
      tipo: 'propio',
      mensajeId: 'm1',
      faltaWaId: true,
    });
  });

  it('el mismo texto con otra wa_id ya asignada es Claudia', () => {
    expect(clasificarFromMe({ waId: 'W', tipo: 'texto', texto: 'hola' }, [s({ wa_id: 'OTRO' })])).toEqual({ tipo: 'claudia' });
  });

  it('otro texto es Claudia', () => {
    expect(clasificarFromMe({ waId: 'W', tipo: 'texto', texto: 'te llamo' }, [s({})])).toEqual({ tipo: 'claudia' });
  });

  it('sin salientes es Claudia', () => {
    expect(clasificarFromMe({ waId: 'W', tipo: 'texto', texto: 'hola' }, [])).toEqual({ tipo: 'claudia' });
  });

  it('el audio sin texto se empareja con el audio saliente sin wa_id', () => {
    const r = clasificarFromMe({ waId: 'W', tipo: 'audio', texto: null }, [s({ id: 'a1', tipo: 'audio', texto: null })]);
    expect(r).toEqual({ tipo: 'propio', mensajeId: 'a1', faltaWaId: true });
  });

  it('un audio no se empareja con un texto', () => {
    expect(clasificarFromMe({ waId: 'W', tipo: 'audio', texto: null }, [s({})])).toEqual({ tipo: 'claudia' });
  });

  it('una foto de Claudia sin pie nunca matchea', () => {
    expect(clasificarFromMe({ waId: 'W', tipo: 'imagen', texto: null }, [s({ tipo: 'imagen', texto: null })])).toEqual({ tipo: 'claudia' });
  });
});
