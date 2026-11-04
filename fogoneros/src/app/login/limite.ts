import 'server-only';

const VENTANA_MS = 15 * 60_000;
const MAX_POR_USUARIO = 5;
const MAX_POR_IP = 20;

type Registro = { fallos: number; vence: number };

// En memoria de cada instancia: frena al que prueba a mano, no a un ataque distribuido.
// La demora de 1 s y el límite propio de Supabase Auth cubren el resto.
const registros = new Map<string, Registro>();

function fallos(clave: string) {
  const r = registros.get(clave);
  if (!r) return 0;
  if (r.vence < Date.now()) {
    registros.delete(clave);
    return 0;
  }
  return r.fallos;
}

function sumar(clave: string) {
  const r = registros.get(clave);
  if (r && r.vence >= Date.now()) r.fallos += 1;
  else registros.set(clave, { fallos: 1, vence: Date.now() + VENTANA_MS });
}

export function bloqueado(ip: string, usuario: string) {
  return fallos(`u:${ip}:${usuario}`) >= MAX_POR_USUARIO || fallos(`ip:${ip}`) >= MAX_POR_IP;
}

export function anotarFallo(ip: string, usuario: string) {
  sumar(`u:${ip}:${usuario}`);
  sumar(`ip:${ip}`);
  if (registros.size > 5000) {
    for (const [clave, r] of registros) if (r.vence < Date.now()) registros.delete(clave);
  }
}

export function limpiarFallos(ip: string, usuario: string) {
  registros.delete(`u:${ip}:${usuario}`);
}
