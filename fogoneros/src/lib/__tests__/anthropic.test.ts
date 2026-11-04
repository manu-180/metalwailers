import { describe, expect, it } from 'vitest';
import { decidirSalto } from '../anthropic';

describe('decidirSalto', () => {
  it.each([401, 403, 429])('%i salta a la key de respaldo', (status) => {
    expect(decidirSalto(status, 'x')).toBe(true);
  });

  it('un 400 de saldo salta', () => {
    expect(decidirSalto(400, 'Your credit balance is too low to access the Anthropic API')).toBe(true);
    expect(decidirSalto(400, 'billing issue')).toBe(true);
  });

  it('un 400 de request mal armado no salta', () => {
    expect(decidirSalto(400, 'messages: roles must alternate')).toBe(false);
  });

  it.each([500, 503, 529, undefined])('%s no salta: lo reintenta el SDK', (status) => {
    expect(decidirSalto(status, 'overloaded')).toBe(false);
  });
});
