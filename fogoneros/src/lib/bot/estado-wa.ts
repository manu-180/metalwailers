import type { EstadoWhatsapp } from '@/lib/tipos';

export function estadoDesdeEvolution(estado: string, actual: EstadoWhatsapp, numero: string | null): EstadoWhatsapp {
  switch (estado) {
    case 'open':
      return 'conectado';
    // Baileys reconecta solo: un connecting suelto no puede frenar al bot, que deja
    // sin responder todo lo que entra mientras wa_estado no sea conectado.
    case 'connecting':
      return actual === 'conectado' ? 'conectado' : 'conectando';
    case 'close':
    case 'refused':
      if (actual === 'sin_vincular') return 'sin_vincular';
      return numero ? 'desconectado' : 'sin_vincular';
    default:
      return actual;
  }
}

export function leerQr(cuerpo: unknown): string | null {
  if (typeof cuerpo !== 'object' || cuerpo === null) return null;
  const raiz = cuerpo as { qrcode?: unknown; base64?: unknown };
  const contenedor = (typeof raiz.qrcode === 'object' && raiz.qrcode !== null ? raiz.qrcode : raiz) as { base64?: unknown };
  const base64 = typeof contenedor.base64 === 'string' ? contenedor.base64.trim() : '';
  if (!base64) return null;
  return base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
}
