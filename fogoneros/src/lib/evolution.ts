import 'server-only';

// El servidor de Evolution es compartido con otras instancias en producción: todo
// lo que sale de acá va atado a EVOLUTION_INSTANCE y no hay forma de nombrar otra.

const TIMEOUT_MS = 15_000;
// Evolution retiene el POST mientras dura `delay` y además convierte el audio con
// ffmpeg antes de responder.
const TIMEOUT_ENVIO_MS = 45_000;
const TIMEOUT_MEDIA_MS = 45_000;
const EVENTOS = ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'];

export type EstadoConexion = 'open' | 'connecting' | 'close' | 'inexistente' | 'desconocido';

export class EvolutionError extends Error {
  constructor(
    readonly status: number,
    readonly cuerpo: unknown,
    ruta: string,
  ) {
    super(`Evolution respondió ${status} en ${ruta}`);
    this.name = 'EvolutionError';
  }
}

function instancia(): string {
  const nombre = process.env.EVOLUTION_INSTANCE;
  if (!nombre) throw new Error('Falta EVOLUTION_INSTANCE');
  return encodeURIComponent(nombre);
}

type Opciones = { method?: 'GET' | 'POST' | 'DELETE'; body?: unknown; timeoutMs?: number };

async function evoFetch(ruta: string, { method = 'GET', body, timeoutMs = TIMEOUT_MS }: Opciones = {}): Promise<unknown> {
  const base = (process.env.EVOLUTION_API_URL ?? '').replace(/\/+$/, '');
  const respuesta = await fetch(`${base}${ruta}`, {
    method,
    headers: {
      apikey: process.env.EVOLUTION_API_KEY ?? '',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const crudo = await respuesta.text();
  let cuerpo: unknown = null;
  try {
    cuerpo = crudo ? JSON.parse(crudo) : null;
  } catch {
    cuerpo = null;
  }
  if (!respuesta.ok) throw new EvolutionError(respuesta.status, cuerpo, ruta);
  return cuerpo;
}

function waIdDe(cuerpo: unknown): string | null {
  const id = (cuerpo as { key?: { id?: unknown } } | null)?.key?.id;
  return typeof id === 'string' && id ? id : null;
}

export async function enviarTexto(numero: string, texto: string, delayMs = 0): Promise<string | null> {
  const cuerpo = await evoFetch(`/message/sendText/${instancia()}`, {
    method: 'POST',
    body: { number: numero, text: texto, ...(delayMs ? { delay: delayMs } : {}) },
    timeoutMs: TIMEOUT_ENVIO_MS,
  });
  return waIdDe(cuerpo);
}

export async function enviarAudio(numero: string, base64: string, delayMs = 0): Promise<string | null> {
  const cuerpo = await evoFetch(`/message/sendWhatsAppAudio/${instancia()}`, {
    method: 'POST',
    body: { number: numero, audio: base64, ...(delayMs ? { delay: delayMs } : {}) },
    timeoutMs: TIMEOUT_ENVIO_MS,
  });
  return waIdDe(cuerpo);
}

export async function bajarMedia(crudo: unknown, timeoutMs = TIMEOUT_MEDIA_MS): Promise<{ base64: string; mimetype: string | null } | null> {
  const cuerpo = (await evoFetch(`/chat/getBase64FromMediaMessage/${instancia()}`, {
    method: 'POST',
    body: { message: crudo, convertToMp4: false },
    timeoutMs,
  })) as { base64?: unknown; mimetype?: unknown } | null;
  if (typeof cuerpo?.base64 !== 'string' || !cuerpo.base64) return null;
  return { base64: cuerpo.base64, mimetype: typeof cuerpo.mimetype === 'string' ? cuerpo.mimetype : null };
}

export async function estadoConexion(): Promise<EstadoConexion> {
  try {
    const cuerpo = (await evoFetch(`/instance/connectionState/${instancia()}`)) as { instance?: { state?: unknown } } | null;
    const estado = cuerpo?.instance?.state;
    return estado === 'open' || estado === 'connecting' || estado === 'close' ? estado : 'desconocido';
  } catch (error) {
    if (error instanceof EvolutionError && error.status === 404) return 'inexistente';
    console.error('[evolution] no pude leer el estado de la instancia', detalleError(error));
    return 'desconocido';
  }
}

export function crearInstancia(): Promise<unknown> {
  return evoFetch('/instance/create', {
    method: 'POST',
    body: {
      instanceName: process.env.EVOLUTION_INSTANCE,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
      groupsIgnore: true,
      syncFullHistory: false,
    },
    timeoutMs: 30_000,
  });
}

// Con la instancia en `connecting` Evolution devuelve el QR vigente sin reiniciar nada;
// sólo con `close` abre una sesión nueva.
export function conectarInstancia(): Promise<unknown> {
  return evoFetch(`/instance/connect/${instancia()}`, { timeoutMs: 30_000 });
}

function urlDelWebhook(): string {
  const app = (process.env.APP_URL ?? '').replace(/\/+$/, '');
  if (!app) throw new Error('Falta APP_URL');
  return `${app}/api/webhook/evolution`;
}

export async function webhookVigente(): Promise<boolean> {
  const cuerpo = (await evoFetch(`/webhook/find/${instancia()}`)) as { url?: unknown; enabled?: unknown } | null;
  return cuerpo?.enabled === true && cuerpo.url === urlDelWebhook();
}

export async function registrarWebhook(): Promise<void> {
  const secreto = process.env.WEBHOOK_SECRET;
  if (!secreto) throw new Error('Falta WEBHOOK_SECRET');
  await evoFetch(`/webhook/set/${instancia()}`, {
    method: 'POST',
    body: {
      webhook: {
        enabled: true,
        url: urlDelWebhook(),
        headers: { 'x-fg-token': secreto },
        // La 2.3.7 lee byEvents y base64 de este objeto: webhookByEvents y webhookBase64
        // pasan la validación y se ignoran en silencio.
        byEvents: false,
        base64: false,
        events: EVENTOS,
      },
    },
  });
}

export async function numeroVinculado(): Promise<string | null> {
  const nombre = process.env.EVOLUTION_INSTANCE ?? '';
  const cuerpo = await evoFetch(`/instance/fetchInstances?instanceName=${encodeURIComponent(nombre)}`);
  const primera = (Array.isArray(cuerpo) ? cuerpo[0] : null) as { ownerJid?: unknown; instance?: { owner?: unknown } } | null;
  const digitos = String(primera?.ownerJid ?? primera?.instance?.owner ?? '').split('@')[0].split(':')[0].replace(/\D/g, '');
  return digitos ? `+${digitos}` : null;
}

export async function cerrarSesion(): Promise<void> {
  try {
    await evoFetch(`/instance/logout/${instancia()}`, { method: 'DELETE' });
  } catch (error) {
    // 404 no existe y 400 no estaba conectada: en los dos el resultado buscado ya se cumple.
    if (error instanceof EvolutionError && (error.status === 404 || error.status === 400)) return;
    throw error;
  }
}

export function mensajeDeEnvio(error: unknown): string {
  if (error instanceof EvolutionError) {
    const respuesta = (error.cuerpo as { response?: { message?: unknown } } | null)?.response?.message;
    const primero = Array.isArray(respuesta) ? (respuesta[0] as { exists?: unknown } | null) : null;
    if (error.status === 400 && primero?.exists === false) return 'Ese número no tiene WhatsApp';
    if (error.status === 401 || error.status === 403) return 'El servidor de WhatsApp rechazó la credencial';
    if (error.status === 404) return 'La instancia de WhatsApp no existe';
    return `El servidor de WhatsApp no pudo enviar el mensaje (error ${error.status})`;
  }
  if (error instanceof Error && error.name === 'TimeoutError') return 'El servidor de WhatsApp tardó demasiado en responder';
  return 'No se pudo enviar el mensaje por WhatsApp';
}

export function detalleError(error: unknown): { nombre: string; status?: number } {
  if (error instanceof EvolutionError) return { nombre: error.name, status: error.status };
  if (error instanceof Error) {
    const status = (error as { status?: unknown }).status;
    return { nombre: error.name, ...(typeof status === 'number' ? { status } : {}) };
  }
  return { nombre: typeof error };
}
