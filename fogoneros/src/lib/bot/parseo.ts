import type { TipoMensaje } from '@/lib/tipos';
import { recortar } from './salida';

export type MensajeEntrante = {
  waId: string;
  fromMe: boolean;
  jid: string;
  lid: string | null;
  telefono: string | null;
  nombre: string | null;
  tipo: TipoMensaje;
  texto: string | null;
  mime: string | null;
  nombreArchivo: string | null;
  tamano: number | null;
  origen: string | null;
  atrasado: boolean;
  crudo: unknown;
};

export type EventoWebhook =
  | { tipo: 'ignorar'; motivo: string }
  | { tipo: 'conexion'; estado: string; numero: string | null }
  | { tipo: 'mensajes'; mensajes: MensajeEntrante[] };

type Objeto = Record<string, unknown>;

const VENTANA_MS = 10 * 60 * 1000;
const MAX_ATRASO_MS = 24 * 60 * 60 * 1000;
// El jid termina adentro de un filtro `.or()` de PostgREST: todo lo que no tenga
// esta forma exacta se descarta acá, antes de llegar a la base.
const JID = /^(\d+)(?::\d+)?@(s\.whatsapp\.net|lid)$/;
const ENVOLTORIOS = [
  'ephemeralMessage',
  'viewOnceMessage',
  'viewOnceMessageV2',
  'viewOnceMessageV2Extension',
  'documentWithCaptionMessage',
];
const SIN_CONTENIDO = ['reactionMessage', 'protocolMessage', 'pollUpdateMessage'];
const RELLENO = ['messageContextInfo', 'senderKeyDistributionMessage'];

function esObjeto(v: unknown): v is Objeto {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function textoNoVacio(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v : null;
}

function numero(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && /^\d+$/.test(v)) return Number(v);
  if (esObjeto(v) && typeof v.low === 'number') return v.low >>> 0;
  return null;
}

function normalizarJid(v: unknown): { jid: string; digitos: string; dominio: string } | null {
  const crudo = String(v ?? '');
  const m = JID.exec(crudo);
  if (!m) return null;
  return { jid: `${m[1]}@${m[2]}`, digitos: m[1], dominio: m[2] };
}

export function esFromMe(v: unknown): boolean {
  return v === true || v === 1 || v === 'true' || v === '1';
}

function desenvolver(mensaje: Objeto): Objeto {
  let actual = mensaje;
  for (let i = 0; i < 4; i++) {
    const envoltorio = ENVOLTORIOS.map((k) => actual[k]).find(esObjeto);
    if (!envoltorio || !esObjeto(envoltorio.message)) return actual;
    actual = envoltorio.message;
  }
  return actual;
}

function esDeAnuncio(ctx: unknown): boolean {
  if (!esObjeto(ctx)) return false;
  return Object.keys(ctx).some((k) => /externalAdReply|conversionSource|ctwa/i.test(k));
}

function origenDe(item: Objeto, mensaje: Objeto): string | null {
  if (esDeAnuncio(item.contextInfo)) return 'instagram';
  for (const valor of Object.values(mensaje)) {
    if (esObjeto(valor) && esDeAnuncio(valor.contextInfo)) return 'instagram';
  }
  return null;
}

type Contenido = Pick<MensajeEntrante, 'tipo' | 'texto' | 'mime' | 'nombreArchivo' | 'tamano'>;

function media(tipo: TipoMensaje, nodo: Objeto): Contenido {
  return {
    tipo,
    texto: textoNoVacio(nodo.caption),
    mime: textoNoVacio(nodo.mimetype),
    nombreArchivo: textoNoVacio(nodo.fileName),
    tamano: numero(nodo.fileLength),
  };
}

function contenidoDe(mensaje: Objeto): Contenido | null {
  const claves = Object.keys(mensaje).filter((k) => !RELLENO.includes(k));
  if (claves.length === 0 || claves.some((k) => SIN_CONTENIDO.includes(k))) return null;

  const texto = textoNoVacio(mensaje.conversation) ?? (esObjeto(mensaje.extendedTextMessage) ? textoNoVacio(mensaje.extendedTextMessage.text) : null);
  if (texto) return { tipo: 'texto', texto, mime: null, nombreArchivo: null, tamano: null };

  const nodos: [string, TipoMensaje][] = [
    ['audioMessage', 'audio'],
    ['imageMessage', 'imagen'],
    ['documentMessage', 'documento'],
    ['videoMessage', 'video'],
    ['ptvMessage', 'video'],
    ['stickerMessage', 'sticker'],
  ];
  for (const [clave, tipo] of nodos) {
    const nodo = mensaje[clave];
    if (esObjeto(nodo)) return media(tipo, nodo);
  }
  return { tipo: 'otro', texto: null, mime: null, nombreArchivo: null, tamano: null };
}

function direcciones(key: Objeto, item: Objeto) {
  const candidatos = [key.remoteJid, key.remoteJidAlt, key.senderPn, item.senderPn, key.senderLid, item.senderLid].map(normalizarJid);
  const telefono = candidatos.find((c) => c?.dominio === 's.whatsapp.net') ?? null;
  const lid = candidatos.find((c) => c?.dominio === 'lid') ?? null;
  return { telefono, lid };
}

function parsearMensaje(item: unknown, ahoraMs: number): MensajeEntrante | null {
  if (!esObjeto(item) || !esObjeto(item.key) || !esObjeto(item.message)) return null;
  const key = item.key;
  const waId = textoNoVacio(key.id);
  if (!waId) return null;
  if (!normalizarJid(key.remoteJid)) return null;

  if (item.type !== undefined && item.type !== 'notify') return null;
  const segundos = numero(item.messageTimestamp);
  const edadMs = segundos === null ? 0 : ahoraMs - segundos * 1000;
  if (edadMs > MAX_ATRASO_MS) {
    console.warn('[parseo] se ignoró un mensaje de más de 24 h');
    return null;
  }

  const mensaje = desenvolver(item.message);
  const contenido = contenidoDe(mensaje);
  if (!contenido) return null;

  const { telefono, lid } = direcciones(key, item);
  const fromMe = esFromMe(key.fromMe);
  return {
    waId,
    fromMe,
    jid: (telefono ?? lid)!.jid,
    lid: lid?.jid ?? null,
    telefono: telefono?.digitos ?? null,
    nombre: fromMe ? null : textoNoVacio(item.pushName)?.trim() ?? null,
    origen: origenDe(item, mensaje),
    atrasado: edadMs > VENTANA_MS,
    crudo: item,
    ...contenido,
    texto: fromMe || !contenido.texto ? contenido.texto : recortar(contenido.texto),
  };
}

export function interpretarEvento(body: unknown, instancia: string, ahoraMs: number): EventoWebhook {
  if (!esObjeto(body)) return { tipo: 'ignorar', motivo: 'sin cuerpo' };
  if (body.instance !== instancia) return { tipo: 'ignorar', motivo: 'otra instancia' };

  const evento = String(body.event ?? '').toLowerCase().replace(/[._-]/g, '');
  if (evento === 'connectionupdate') {
    if (!esObjeto(body.data)) return { tipo: 'ignorar', motivo: 'conexion sin datos' };
    const destino = normalizarJid(body.data.wuid);
    return { tipo: 'conexion', estado: String(body.data.state ?? ''), numero: destino ? `+${destino.digitos}` : null };
  }
  if (evento !== 'messagesupsert') return { tipo: 'ignorar', motivo: 'evento ajeno' };

  const lote = Array.isArray(body.data) ? body.data : [body.data];
  const mensajes = lote.map((item) => parsearMensaje(item, ahoraMs)).filter((m): m is MensajeEntrante => m !== null);
  if (mensajes.length === 0) return { tipo: 'ignorar', motivo: 'nada para procesar' };
  return { tipo: 'mensajes', mensajes };
}
