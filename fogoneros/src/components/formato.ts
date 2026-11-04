const ZONA = 'America/Argentina/Buenos_Aires';

const fHora = new Intl.DateTimeFormat('es-AR', { timeZone: ZONA, hour: '2-digit', minute: '2-digit', hour12: false });
const fClave = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' });
const fDiaSemana = new Intl.DateTimeFormat('es-AR', { timeZone: ZONA, weekday: 'long' });
const fFechaCorta = new Intl.DateTimeFormat('es-AR', { timeZone: ZONA, day: '2-digit', month: '2-digit', year: '2-digit' });
const fFechaLarga = new Intl.DateTimeFormat('es-AR', { timeZone: ZONA, day: 'numeric', month: 'long' });
const fFechaAnio = new Intl.DateTimeFormat('es-AR', { timeZone: ZONA, day: 'numeric', month: 'long', year: 'numeric' });

const claveDia = (d: Date) => fClave.format(d);

function diasDeDiferencia(iso: string) {
  const hoy = Date.parse(`${claveDia(new Date())}T00:00:00Z`);
  const otro = Date.parse(`${claveDia(new Date(iso))}T00:00:00Z`);
  return Math.round((hoy - otro) / 86_400_000);
}

export const horaCorta = (iso: string) => fHora.format(new Date(iso));
export const mismoDia = (a: string, b: string) => claveDia(new Date(a)) === claveDia(new Date(b));

export function cuandoEnLista(iso: string | null) {
  if (!iso) return '';
  const dias = diasDeDiferencia(iso);
  if (dias <= 0) return horaCorta(iso);
  if (dias === 1) return 'Ayer';
  if (dias < 7) return fDiaSemana.format(new Date(iso));
  return fFechaCorta.format(new Date(iso));
}

export function etiquetaDia(iso: string) {
  const dias = diasDeDiferencia(iso);
  if (dias <= 0) return 'Hoy';
  if (dias === 1) return 'Ayer';
  const d = new Date(iso);
  return dias < 300 ? fFechaLarga.format(d) : fFechaAnio.format(d);
}

export function fechaConHora(iso: string) {
  return `${etiquetaDia(iso)}, ${horaCorta(iso)}`;
}

export function diaDelGrafico(dia: string) {
  const d = new Date(`${dia}T12:00:00Z`);
  return { inicial: fDiaSemana.format(d).charAt(0).toUpperCase(), completo: fFechaLarga.format(d) };
}

export function telefonoLindo(telefono: string | null) {
  if (!telefono) return null;
  const n = telefono.replace(/\D/g, '');
  if (n.startsWith('54911') && n.length === 13) return `+54 9 11 ${n.slice(5, 9)}-${n.slice(9)}`;
  if (n.startsWith('549')) return `+54 9 ${n.slice(3)}`;
  return `+${n}`;
}

export function nombreDeChat(chat: { nombre: string | null; telefono: string | null }) {
  return chat.nombre?.trim() || telefonoLindo(chat.telefono) || 'Sin nombre';
}

export function tiempoGrabado(segundos: number) {
  const m = Math.floor(segundos / 60);
  return `${m}:${String(segundos % 60).padStart(2, '0')}`;
}
