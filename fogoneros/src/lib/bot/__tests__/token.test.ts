import { describe, expect, it } from 'vitest';
import { tokenValido } from '../token';

describe('tokenValido', () => {
  it('acepta el token exacto', () => {
    expect(tokenValido('secreto', 'secreto')).toBe(true);
  });

  it('rechaza otro token o de otro largo', () => {
    expect(tokenValido('secret0', 'secreto')).toBe(false);
    expect(tokenValido('secreto-largo', 'secreto')).toBe(false);
  });

  it('falla cerrado sin secreto o sin token', () => {
    expect(tokenValido('x', '')).toBe(false);
    expect(tokenValido('x', undefined)).toBe(false);
    expect(tokenValido('', '')).toBe(false);
    expect(tokenValido(null, 'secreto')).toBe(false);
  });
});
