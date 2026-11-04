import type { TipoMensaje } from '@/lib/tipos';

export type Saliente = {
  id: string;
  wa_id: string | null;
  tipo: TipoMensaje;
  texto: string | null;
};

export type Eco = {
  waId: string;
  tipo: TipoMensaje;
  texto: string | null;
};

export type ClaseFromMe = { tipo: 'propio'; mensajeId: string; faltaWaId: boolean } | { tipo: 'claudia' };

function normalizar(texto: string | null): string {
  return (texto ?? '').replace(/\s+/g, ' ').trim();
}

export function clasificarFromMe(eco: Eco, salientes: Saliente[]): ClaseFromMe {
  const conocido = salientes.find((s) => s.wa_id === eco.waId);
  if (conocido) return { tipo: 'propio', mensajeId: conocido.id, faltaWaId: false };

  // Sólo contra salientes sin wa_id: si Claudia escribe desde el teléfono lo mismo
  // que el bot acaba de mandar, ese wa_id ya es otro y es ella hablando.
  const sinId = salientes.filter((s) => s.wa_id === null && s.tipo === eco.tipo);
  const texto = normalizar(eco.texto);
  const propio = texto ? sinId.find((s) => normalizar(s.texto) === texto) : eco.tipo === 'audio' ? sinId[0] : undefined;
  return propio ? { tipo: 'propio', mensajeId: propio.id, faltaWaId: true } : { tipo: 'claudia' };
}
