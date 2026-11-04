const MAX_MENSAJES = 3;
const ETIQUETA = /<\/?[a-zñ_][\w-]*[^<>]*>/i;
const CORCHETES = /\[[^\]]*\]/;
const SILENCIO = /^silencio[.!]?$/i;

const NO_ES_NOMBRE = new Set([
  'ventas', 'venta', 'info', 'informacion', 'admin', 'administracion', 'empresa', 'tienda', 'shop', 'store',
  'oficial', 'negocio', 'comercial', 'srl', 'sa', 'sas', 'muebles', 'deco', 'hierros', 'parrillas', 'fogoneros',
  'fogones', 'construcciones', 'servicios', 'atencion', 'cliente', 'whatsapp', 'y', 'e',
]);

function quitarMarkdown(texto: string): string {
  return texto
    .split('\n')
    .map((linea) =>
      linea
        .replace(/^\s{0,3}#{1,6}\s+/, '')
        .replace(/^\s*[-*•]\s+/, '')
        .replace(/^\s*\d+[.)]\s+/, ''),
    )
    .join('\n')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])/g, '$1')
    .replace(/`/g, '')
    .replace(/\*{2,}/g, '');
}

export function limpiarSalida(texto: string): string[] {
  const partes = quitarMarkdown(texto.replace(/[¿¡]/g, ''))
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p && !SILENCIO.test(p) && !ETIQUETA.test(p) && !CORCHETES.test(p));

  if (partes.length <= MAX_MENSAJES) return partes;
  return [...partes.slice(0, MAX_MENSAJES - 1), partes.slice(MAX_MENSAJES - 1).join(' ')];
}

function sinTildes(palabra: string): string {
  return palabra.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

export function primerNombre(pushName: string | null | undefined): string | null {
  const palabras = (pushName ?? '').trim().split(/\s+/).filter(Boolean);
  if (palabras.length === 0 || palabras.length > 4) return null;
  if (!palabras.every((p) => /^\p{L}[\p{L}'’.-]*$/u.test(p))) return null;
  if (palabras.some((p) => NO_ES_NOMBRE.has(sinTildes(p)))) return null;

  const primero = palabras[0];
  if ([...primero].length < 2) return null;
  const [inicial, ...resto] = [...primero.toLowerCase()];
  return inicial.toUpperCase() + resto.join('');
}

export function armarSaludo(plantilla: string, pushName: string | null | undefined): string {
  const nombre = primerNombre(pushName);
  if (nombre) return plantilla.replaceAll('{nombre}', nombre).trim();
  return plantilla.replace(/\s*\{nombre\}/g, '').replace(/^[\s,;.:]+/, '').trim();
}

export function delayHumano(texto: string): number {
  return Math.min(6000, Math.max(1500, 1200 + texto.length * 30));
}
