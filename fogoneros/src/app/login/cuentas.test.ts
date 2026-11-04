import { describe, expect, it } from 'vitest';
import { cuentaDe } from './cuentas';

describe('cuentaDe', () => {
  it('traduce el mail que se escribe a la cuenta interna', () => {
    expect(cuentaDe('santi@gmail.com')).toBe('santi@metalwailers.com');
    expect(cuentaDe(' Claudia@Gmail.com ')).toBe('claudia@metalwailers.com');
    expect(cuentaDe('manunv97@gmail.com')).toBe('manuel@metalwailers.com');
  });

  it('un mail que no es del equipo no llega a Supabase', () => {
    expect(cuentaDe('otro@gmail.com')).toBeNull();
    expect(cuentaDe('santi@metalwailers.com')).toBeNull();
    expect(cuentaDe('')).toBeNull();
  });
});
