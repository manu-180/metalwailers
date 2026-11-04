import 'server-only';
import Anthropic from '@anthropic-ai/sdk';

const MODELO_POR_DEFECTO = 'claude-opus-5-5';
const PRINCIPAL_AFUERA_MS = 30 * 60 * 1000;
const MAX_TOKENS = 4000;

let principalAfueraHasta = 0;
const clientes = new Map<string, Anthropic>();

export function decidirSalto(status: number | undefined, mensaje: string): boolean {
  if (status === 401 || status === 403 || status === 429) return true;
  return status === 400 && /credit|billing/i.test(mensaje);
}

// Un 429 se resuelve con la otra key, no esperando: el SDK lo reintentaría respetando
// retry-after, y el turno tiene 120 s de lock y al cliente del otro lado.
const fetchSinEsperarCupo: typeof fetch = async (url, init) => {
  const respuesta = await fetch(url, init);
  if (respuesta.status !== 429) return respuesta;
  const headers = new Headers(respuesta.headers);
  headers.set('x-should-retry', 'false');
  return new Response(respuesta.body, { status: 429, statusText: respuesta.statusText, headers });
};

function cliente(apiKey: string): Anthropic {
  let existente = clientes.get(apiKey);
  if (!existente) {
    existente = new Anthropic({ apiKey, maxRetries: 1, timeout: 30_000, fetch: fetchSinEsperarCupo });
    clientes.set(apiKey, existente);
  }
  return existente;
}

export function esErrorPermanente(error: unknown): boolean {
  if (!(error instanceof Anthropic.APIError) || error.status === undefined) return false;
  if (decidirSalto(error.status, error.message)) return false;
  return error.status >= 400 && error.status < 500 && error.status !== 408 && error.status !== 409;
}

type Pedido = {
  system: Anthropic.Beta.BetaTextBlockParam[];
  messages: Anthropic.Beta.BetaMessageParam[];
  tools: Anthropic.Beta.BetaTool[];
};

function llamar(apiKey: string, pedido: Pedido) {
  return cliente(apiKey).beta.messages.create({
    model: process.env.BOT_MODELO || MODELO_POR_DEFECTO,
    max_tokens: MAX_TOKENS,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low' },
    tool_choice: { type: 'auto' },
    ...pedido,
  });
}

export async function pedirRespuesta(pedido: Pedido) {
  const principal = process.env.ANTHROPIC_API_KEY;
  const respaldo = process.env.ANTHROPIC_API_KEY_RESPALDO;
  if (!principal && !respaldo) throw new Error('Faltan las keys de Anthropic');

  if (principal && (Date.now() >= principalAfueraHasta || !respaldo)) {
    try {
      return await llamar(principal, pedido);
    } catch (error) {
      const salta = error instanceof Anthropic.APIError && decidirSalto(error.status, error.message);
      if (!salta || !respaldo) throw error;
      principalAfueraHasta = Date.now() + PRINCIPAL_AFUERA_MS;
      console.error('[anthropic] salto a la key de respaldo', { status: error.status });
    }
  }
  return llamar(respaldo!, pedido);
}
