import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Config, EstadoWhatsapp } from '@/lib/tipos';
import { estadoDesdeEvolution, leerQr } from '@/lib/bot/estado-wa';
import {
  cerrarSesion,
  conectarInstancia,
  crearInstancia,
  detalleError,
  estadoConexion,
  numeroVinculado,
  registrarWebhook,
  webhookVigente,
  type EstadoConexion,
} from '@/lib/evolution';

type Vinculo = { estado: EstadoWhatsapp; qr: string | null; numero: string | null };
type Guardado = Pick<Config, 'wa_estado' | 'wa_numero'>;

async function leerGuardado(): Promise<Guardado> {
  const { data, error } = await supabaseAdmin().from('fg_config').select('wa_estado, wa_numero').eq('id', 1).single();
  if (error || !data) throw new Error(`No pude leer fg_config: ${error?.code ?? 'sin fila'}`);
  return data as Guardado;
}

// Condicional sobre lo leído: entre la lectura y este update desvincular() puede haber
// dejado sin_vincular, y un close del webhook que venía en camino no lo tiene que pisar.
async function guardar(estado: EstadoWhatsapp, numero: string | null, previo: EstadoWhatsapp | null): Promise<void> {
  const ahora = new Date().toISOString();
  const nuevoVinculo = estado === 'conectado' && (previo === 'sin_vincular' || previo === 'conectando');
  let consulta = supabaseAdmin()
    .from('fg_config')
    .update({ wa_estado: estado, wa_numero: numero, wa_estado_at: ahora, ...(nuevoVinculo ? { vinculado_at: ahora } : {}) })
    .eq('id', 1);
  if (previo) consulta = consulta.eq('wa_estado', previo);
  const { error } = await consulta;
  if (error) throw new Error(`No pude guardar el estado de WhatsApp: ${error.code}`);
}

// Sin webhook no entra ningún mensaje aunque la sesión esté abierta: se muestra como
// desconectado para que el panel lo marque y el cron lo vuelva a intentar.
async function alConectar(guardado: Guardado): Promise<{ estado: EstadoWhatsapp; numero: string | null }> {
  const numero = await numeroVinculado().catch((error) => {
    console.error('[vinculacion] no pude leer el número vinculado', detalleError(error));
    return guardado.wa_numero;
  });
  try {
    await registrarWebhook();
  } catch (error) {
    console.error('[vinculacion] no pude registrar el webhook', detalleError(error));
    await guardar('desconectado', numero, guardado.wa_estado);
    return { estado: 'desconectado', numero };
  }
  await guardar('conectado', numero, guardado.wa_estado);
  return { estado: 'conectado', numero };
}

function estadoSinSesion(conexion: EstadoConexion, guardado: Guardado): EstadoWhatsapp {
  return conexion === 'inexistente' ? 'sin_vincular' : estadoDesdeEvolution(conexion, guardado.wa_estado, guardado.wa_numero);
}

async function asentar(conexion: EstadoConexion, guardado: Guardado) {
  const estado = estadoSinSesion(conexion, guardado);
  const numero = estado === 'sin_vincular' ? null : guardado.wa_numero;
  if (estado !== guardado.wa_estado) await guardar(estado, numero, guardado.wa_estado);
  return { estado, numero };
}

export async function estadoVinculacion(): Promise<{ estado: EstadoWhatsapp; numero: string | null }> {
  const guardado = await leerGuardado();
  const conexion = await estadoConexion();
  if (conexion === 'desconocido') return { estado: guardado.wa_estado, numero: guardado.wa_numero };
  return asentar(conexion, guardado);
}

export async function iniciarVinculacion(): Promise<Vinculo> {
  const guardado = await leerGuardado();
  try {
    const conexion = await estadoConexion();
    if (conexion === 'desconocido') return { estado: guardado.wa_estado, qr: null, numero: guardado.wa_numero };
    if (conexion === 'open') return { ...(await alConectar(guardado)), qr: null };

    const cuerpo = conexion === 'inexistente' ? await crearInstancia() : await conectarInstancia();
    await registrarWebhook();
    await guardar('conectando', guardado.wa_numero, guardado.wa_estado);
    return { estado: 'conectando', qr: leerQr(cuerpo), numero: guardado.wa_numero };
  } catch (error) {
    console.error('[vinculacion] no pude iniciar la vinculación', detalleError(error));
    return { estado: guardado.wa_estado, qr: null, numero: guardado.wa_numero };
  }
}

export async function consultarVinculacion(): Promise<Vinculo> {
  const guardado = await leerGuardado();
  const conexion = await estadoConexion();
  if (conexion === 'desconocido') return { estado: guardado.wa_estado, qr: null, numero: guardado.wa_numero };

  if (conexion === 'open') {
    if (guardado.wa_estado === 'conectado') return { estado: 'conectado', qr: null, numero: guardado.wa_numero };
    return { ...(await alConectar(guardado)), qr: null };
  }

  const { estado, numero } = await asentar(conexion, guardado);

  // El QR rota cada pocos segundos: si la pantalla se quedara con el primero, el
  // escaneo fallaría.
  if (conexion === 'connecting' && estado === 'conectando') {
    const cuerpo = await conectarInstancia().catch((error) => {
      console.error('[vinculacion] no pude leer el QR vigente', detalleError(error));
      return null;
    });
    return { estado, qr: leerQr(cuerpo), numero };
  }
  return { estado, qr: null, numero };
}

export async function desvincular(): Promise<void> {
  await cerrarSesion();
  await guardar('sin_vincular', null, null);
}

export async function aplicarEstadoDelWebhook(conexion: string, numero: string | null): Promise<void> {
  const guardado = await leerGuardado();
  const estado = estadoDesdeEvolution(conexion, guardado.wa_estado, guardado.wa_numero);
  if (estado === guardado.wa_estado) return;
  await guardar(estado, estado === 'sin_vincular' ? null : (numero ?? guardado.wa_numero), guardado.wa_estado);
}

async function verificarWebhook(guardado: Guardado): Promise<void> {
  let vigente: boolean;
  try {
    vigente = await webhookVigente();
  } catch (error) {
    console.error('[vinculacion] no pude consultar el webhook', detalleError(error));
    return;
  }
  if (vigente) return;
  try {
    await registrarWebhook();
  } catch (error) {
    console.error('[vinculacion] no pude reasegurar el webhook', detalleError(error));
    await guardar('desconectado', guardado.wa_numero, guardado.wa_estado);
  }
}

export async function refrescarEstado(): Promise<void> {
  const guardado = await leerGuardado();
  const conexion = await estadoConexion();
  if (conexion === 'desconocido') return;

  if (conexion !== 'open') {
    await asentar(conexion, guardado);
    return;
  }
  if (guardado.wa_estado === 'conectado') await verificarWebhook(guardado);
  else await alConectar(guardado);
}
