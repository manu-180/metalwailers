import { createHash, timingSafeEqual } from 'node:crypto';

function huella(valor: string): Buffer {
  return createHash('sha256').update(valor).digest();
}

export function tokenValido(recibido: string | null | undefined, secreto: string | null | undefined): boolean {
  if (!recibido || !secreto) return false;
  return timingSafeEqual(huella(recibido), huella(secreto));
}
