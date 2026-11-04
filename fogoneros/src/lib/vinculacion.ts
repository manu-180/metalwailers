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
} from '@/lib/evolution';

type Vinculo = { estado: EstadoWhatsapp; qr: string | null; numero: string | null };
type Guardado = Pick<Config, 'wa_estado' | 'wa_numero'>;

async function leerGuardado(): Promise<Guardado> {
  const { data, error } = await supabaseAdmin().from('fg_config').select('wa_estado, wa_numero').eq('id', 1).single();
  if (error || !data) throw new Error(`No pude leer fg_config: ${error?.code ?? 'sin fila'}`);
  return data as Guardado;
}

async function guardar(estado: EstadoWhatsapp, numero: string | null): Promise<void> {
  const { error } = await supabaseAdmin()
    .from('fg_config')
    .update({ wa_estado: estado, wa_numero: numero, wa_estado_at: new Date().toISOString() })
    .eq('id', 1);
  if (error) throw new Error(`No pude guardar el estado de WhatsApp: ${error.code}`);
}

async function asegurarWebhook(): Promise<void> {
  try {
    await registrarWebhook();
  } catch (error) {
    console.error('[vinculacion] no pude registrar el webhook', detalleError(error));
  }
}

async function alConectar(numeroAnterior: string | null): Promise<string | null> {
  const numero = await numeroVinculado().catch((error) => {
    console.error('[vinculacion] no pude leer el número vinculado', detalleError(error));
    return numeroAnterior;
  });
  await asegurarWebhook();
  await guardar('conectado', numero);
  return numero;
}

export async function estadoVinculacion(): Promise<{ estado: EstadoWhatsapp; numero: string | null }> {
  const guardado = await leerGuardado();
  const conexion = await estadoConexion();
  if (conexion === 'desconocido') return { estado: guardado.wa_estado, numero: guardado.wa_numero };

  const estado = conexion === 'inexistente' ? 'sin_vincular' : estadoDesdeEvolution(conexion, guardado.wa_estado, guardado.wa_numero);
  const numero = estado === 'sin_vincular' ? null : guardado.wa_numero;
  if (estado !== guardado.wa_estado) await guardar(estado, numero);
  return { estado, numero };
}

export async function iniciarVinculacion(): Promise<Vinculo> {
  const guardado = await leerGuardado();
  try {
    const conexion = await estadoConexion();
    if (conexion === 'desconocido') return { estado: guardado.wa_estado, qr: null, numero: guardado.wa_numero };
    if (conexion === 'open') {
      const numero = await alConectar(guardado.wa_numero);
      return { estado: 'conectado', qr: null, numero };
    }

    const cuerpo = conexion === 'inexistente' ? await crearInstancia() : await conectarInstancia();
    await asegurarWebhook();
    await guardar('conectando', guardado.wa_numero);
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
    const numero = await alConectar(guardado.wa_numero);
    return { estado: 'conectado', qr: null, numero };
  }

  const estado = conexion === 'inexistente' ? 'sin_vincular' : estadoDesdeEvolution(conexion, guardado.wa_estado, guardado.wa_numero);
  const numero = estado === 'sin_vincular' ? null : guardado.wa_numero;
  if (estado !== guardado.wa_estado) await guardar(estado, numero);

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
  await guardar('sin_vincular', null);
}

export async function aplicarEstadoDelWebhook(conexion: string, numero: string | null): Promise<void> {
  const guardado = await leerGuardado();
  const estado = estadoDesdeEvolution(conexion, guardado.wa_estado, guardado.wa_numero);
  if (estado === guardado.wa_estado) return;
  await guardar(estado, estado === 'sin_vincular' ? null : (numero ?? guardado.wa_numero));
}

export async function refrescarEstado(): Promise<void> {
  const guardado = await leerGuardado();
  const conexion = await estadoConexion();
  if (conexion === 'desconocido') return;

  if (conexion === 'open') {
    if (guardado.wa_estado !== 'conectado') await alConectar(guardado.wa_numero);
    return;
  }
  const estado = conexion === 'inexistente' ? 'sin_vincular' : estadoDesdeEvolution(conexion, guardado.wa_estado, guardado.wa_numero);
  if (estado !== guardado.wa_estado) await guardar(estado, estado === 'sin_vincular' ? null : guardado.wa_numero);
}
