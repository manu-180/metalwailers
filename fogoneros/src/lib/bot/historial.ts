import type Anthropic from '@anthropic-ai/sdk';
import type { Mensaje } from '@/lib/tipos';
import { recortar } from './salida';

type Bloque = Anthropic.Beta.BetaContentBlockParam;
type Turno = Anthropic.Beta.BetaMessageParam;
type MimeImagen = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

export type Adjunto = { base64: string; mime: string };

export type OpcionesHistorial = {
  // Sin definir respeta el orden de la charla; null es que no se atendió nada todavía.
  atendidoHasta?: string | null;
  adjuntos?: Map<string, Adjunto>;
};

const MAX_ADJUNTOS = 3;
const MAX_CARACTERES = 20_000;
const IMAGENES: readonly string[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Postgres guarda microsegundos y Date.parse los corta: dos mensajes en el mismo
// milisegundo se verían iguales y el segundo quedaría como atendido.
function momento(fecha: string): number {
  const fraccion = /\.(\d{1,6})/.exec(fecha)?.[1] ?? '';
  return Math.floor(Date.parse(fecha) / 1000) * 1_000_000 + Number(fraccion.padEnd(6, '0'));
}

export function esPosterior(fecha: string, referencia: string): boolean {
  return momento(fecha) > momento(referencia);
}

export function sinAtender(mensajes: Mensaje[], atendidoHasta: string | null): Mensaje[] {
  return mensajes.filter((m) => m.autor === 'cliente' && (atendidoHasta === null || esPosterior(m.creado, atendidoHasta)));
}

function mimeBase(mime: string | null): string {
  return (mime ?? '').split(';')[0].trim().toLowerCase();
}

function legibleParaElModelo(m: Mensaje): boolean {
  if (!m.media_path) return false;
  if (m.tipo === 'imagen') return IMAGENES.includes(mimeBase(m.media_mime));
  return m.tipo === 'documento' && mimeBase(m.media_mime) === 'application/pdf';
}

// Una fila en 'enviando' puede haber salido aunque la función muriera antes de confirmar:
// tratarla como no enviada hace que el bot responda dos veces.
function esVisibleEnLaCharla(m: Mensaje): boolean {
  return m.autor === 'cliente' || m.estado !== 'error';
}

// Los corchetes marcan lo que escribe el sistema: en un texto ajeno servirían para
// hacerse pasar por una anotación interna.
function neutralizar(texto: string): string {
  return recortar(texto).replace(/\[/g, '(').replace(/\]/g, ')');
}

// Cuando la media falla, `texto` guarda el aviso para el panel, y ese aviso no es
// algo que el cliente haya escrito.
function pieDe(m: Mensaje): string | null {
  const pie = m.texto?.trim();
  return pie && m.texto !== m.error ? neutralizar(pie) : null;
}

function texto(contenido: string): Bloque {
  return { type: 'text', text: contenido };
}

function notaConPie(nota: string, m: Mensaje): Bloque[] {
  const pie = pieDe(m);
  return [texto(pie ? `${nota} ${pie}` : nota)];
}

function bloquesDelCliente(m: Mensaje, adjunto: Adjunto | undefined): Bloque[] {
  const pie = pieDe(m);
  const nombre = m.media_nombre ? neutralizar(m.media_nombre) : null;
  switch (m.tipo) {
    case 'audio':
      return m.transcripcion
        ? [texto(`[Audio del cliente, transcripto] ${neutralizar(m.transcripcion)}`)]
        : [texto('[El cliente mandó un audio que no se pudo transcribir. No sabés qué dijo.]')];
    case 'imagen': {
      if (adjunto) {
        const imagen: Bloque = {
          type: 'image',
          source: { type: 'base64', media_type: mimeBase(adjunto.mime) as MimeImagen, data: adjunto.base64 },
        };
        return pie ? [imagen, texto(pie)] : [imagen];
      }
      return notaConPie(m.media_path ? '[El cliente mandó una foto]' : '[El cliente mandó una foto que no se pudo abrir]', m);
    }
    case 'documento': {
      if (adjunto) {
        const documento: Bloque = {
          type: 'document',
          title: nombre ?? 'documento.pdf',
          source: { type: 'base64', media_type: 'application/pdf', data: adjunto.base64 },
        };
        return pie ? [documento, texto(pie)] : [documento];
      }
      return notaConPie(`[El cliente mandó un documento${nombre ? `: ${nombre}` : ''}. No lo podés abrir.]`, m);
    }
    case 'video':
      return notaConPie('[El cliente mandó un video. No lo podés ver.]', m);
    case 'sticker':
      return [texto('[El cliente mandó un sticker]')];
    case 'otro':
      return [texto('[El cliente mandó algo que no se puede leer acá, como una ubicación o un contacto]')];
    default:
      return pie ? [texto(pie)] : [];
  }
}

function bloquesPropios(m: Mensaje): Bloque[] {
  if (m.tipo === 'texto') {
    const pie = pieDe(m);
    return pie ? [texto(pie)] : [];
  }
  if (m.tipo === 'audio') {
    if (m.transcripcion) return [texto(`[Audio enviado, transcripto] ${neutralizar(m.transcripcion)}`)];
    return [texto(m.autor === 'bot' ? '[Audio de bienvenida enviado]' : '[Audio enviado]')];
  }
  return notaConPie('[Archivo enviado]', m);
}

function largoDe(m: Mensaje): number {
  return Math.min(m.texto?.length ?? 0, 2000) + Math.min(m.transcripcion?.length ?? 0, 2000);
}

// Lo sin atender va al final aunque sea anterior a una fila propia: esa fila se inserta
// antes del delay de Evolution, y lo que escribió el cliente mientras tanto sigue sin respuesta.
function enOrdenParaElModelo(mensajes: Mensaje[], atendidoHasta: string | null | undefined): Mensaje[] {
  if (atendidoHasta === undefined) return mensajes;
  const pendientes = new Set(sinAtender(mensajes, atendidoHasta));
  return [...mensajes.filter((m) => !pendientes.has(m)), ...pendientes];
}

function dentroDelTope(mensajes: Mensaje[]): Mensaje[] {
  let total = 0;
  let desde = mensajes.length;
  while (desde > 0) {
    total += largoDe(mensajes[desde - 1]);
    if (total > MAX_CARACTERES && desde < mensajes.length) break;
    desde -= 1;
  }
  return mensajes.slice(desde);
}

export function armarHistorial(mensajes: Mensaje[], opciones: OpcionesHistorial = {}): Turno[] {
  const turnos: { role: 'user' | 'assistant'; content: Bloque[] }[] = [];
  const visibles = mensajes.filter(esVisibleEnLaCharla);

  for (const m of dentroDelTope(enOrdenParaElModelo(visibles, opciones.atendidoHasta))) {
    const role = m.autor === 'cliente' ? 'user' : 'assistant';
    const bloques = role === 'user' ? bloquesDelCliente(m, opciones.adjuntos?.get(m.id)) : bloquesPropios(m);
    if (bloques.length === 0) continue;
    if (turnos.length === 0 && role === 'assistant') continue;

    const ultimo = turnos.at(-1);
    if (ultimo?.role === role) ultimo.content.push(...bloques);
    else turnos.push({ role, content: bloques });
  }
  return turnos;
}

export function adjuntosParaCargar(mensajes: Mensaje[], atendidoHasta: string | null): Mensaje[] {
  return sinAtender(mensajes, atendidoHasta).filter(legibleParaElModelo).slice(-MAX_ADJUNTOS);
}
