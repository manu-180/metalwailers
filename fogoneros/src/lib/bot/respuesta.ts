import { limpiarSalida } from './salida';

type BloqueRespuesta = { type: string; text?: string; name?: string; input?: unknown };

export type RespuestaModelo = {
  stop_reason: string | null;
  content: BloqueRespuesta[];
};

export type RespuestaInterpretada = {
  partes: string[];
  pasarMotivo: string | null;
  fallo: 'rechazo' | 'cortada' | null;
};

const MOTIVO_POR_DEFECTO = 'El asistente pidió que siga Claudia';

function motivoDe(input: unknown): string {
  const motivo = (input as { motivo?: unknown } | null)?.motivo;
  const limpio = typeof motivo === 'string' ? motivo.trim().slice(0, 300) : '';
  return limpio || MOTIVO_POR_DEFECTO;
}

export function interpretarRespuesta(respuesta: RespuestaModelo): RespuestaInterpretada {
  if (respuesta.stop_reason === 'refusal') return { partes: [], pasarMotivo: null, fallo: 'rechazo' };
  if (respuesta.stop_reason === 'max_tokens' || respuesta.stop_reason === 'model_context_window_exceeded') {
    return { partes: [], pasarMotivo: null, fallo: 'cortada' };
  }

  const texto = respuesta.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('\n\n');
  const pasar = respuesta.content.find((b) => b.type === 'tool_use' && b.name === 'pasar_a_claudia');

  return { partes: limpiarSalida(texto), pasarMotivo: pasar ? motivoDe(pasar.input) : null, fallo: null };
}
