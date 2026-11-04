import type Anthropic from '@anthropic-ai/sdk';
import type { Mensaje } from '@/lib/tipos';

type Bloque = Anthropic.Beta.BetaContentBlockParam;
type Turno = Anthropic.Beta.BetaMessageParam;
type MimeImagen = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

export type Adjunto = { base64: string; mime: string };

export type OpcionesHistorial = {
  excluir?: Set<string>;
  adjuntos?: Map<string, Adjunto>;
};

const MAX_ADJUNTOS = 3;
const IMAGENES: readonly string[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function mimeBase(mime: string | null): string {
  return (mime ?? '').split(';')[0].trim().toLowerCase();
}

function legibleParaElModelo(m: Mensaje): boolean {
  if (!m.media_path) return false;
  if (m.tipo === 'imagen') return IMAGENES.includes(mimeBase(m.media_mime));
  return m.tipo === 'documento' && mimeBase(m.media_mime) === 'application/pdf';
}

function esVisibleEnLaCharla(m: Mensaje): boolean {
  return m.autor === 'cliente' || m.estado === 'ok';
}

// Cuando la media falla, `texto` guarda el aviso para el panel, y ese aviso no es
// algo que el cliente haya escrito.
function pieDe(m: Mensaje): string | null {
  const pie = m.texto?.trim();
  return pie && m.texto !== m.error ? pie : null;
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
  switch (m.tipo) {
    case 'audio':
      return m.transcripcion
        ? [texto(`[Audio del cliente, transcripto] ${m.transcripcion}`)]
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
          title: m.media_nombre ?? 'documento.pdf',
          source: { type: 'base64', media_type: 'application/pdf', data: adjunto.base64 },
        };
        return pie ? [documento, texto(pie)] : [documento];
      }
      return notaConPie(`[El cliente mandó un documento${m.media_nombre ? `: ${m.media_nombre}` : ''}. No lo podés abrir.]`, m);
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
    if (m.transcripcion) return [texto(`[Audio enviado, transcripto] ${m.transcripcion}`)];
    return [texto(m.autor === 'bot' ? '[Audio de bienvenida enviado]' : '[Audio enviado]')];
  }
  return notaConPie('[Archivo enviado]', m);
}

export function armarHistorial(mensajes: Mensaje[], opciones: OpcionesHistorial = {}): Turno[] {
  const turnos: { role: 'user' | 'assistant'; content: Bloque[] }[] = [];

  for (const m of mensajes) {
    if (opciones.excluir?.has(m.id) || !esVisibleEnLaCharla(m)) continue;
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

export function adjuntosParaCargar(mensajes: Mensaje[], excluir?: Set<string>): Mensaje[] {
  const visibles = mensajes.filter((m) => !excluir?.has(m.id) && esVisibleEnLaCharla(m));
  const ultimaPropia = visibles.findLastIndex((m) => m.autor !== 'cliente');
  return visibles
    .slice(ultimaPropia + 1)
    .filter(legibleParaElModelo)
    .slice(-MAX_ADJUNTOS);
}
