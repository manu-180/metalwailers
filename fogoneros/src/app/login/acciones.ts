'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { supabaseServidor } from '@/lib/supabase/server';
import { cuentaDe } from './cuentas';
import { anotarFallo, bloqueado, limpiarFallos } from './limite';

export type EstadoLogin = {
  error?: string;
  errores?: { usuario?: string; contrasena?: string };
  usuario?: string;
};

const esquema = z.object({
  usuario: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Escribí tu mail')
    .max(80, 'Ese mail es muy largo')
    .email('Revisá que el mail esté bien escrito'),
  contrasena: z.string().min(1, 'Escribí tu contraseña').max(200, 'Esa contraseña es muy larga'),
});

const MENSAJE_GENERICO = 'No pudimos entrar. Revisá los datos o probá de nuevo en unos minutos.';

const DEMORA_MS = 1500;

// Medido desde el inicio y no como pausa fija: si no, un intento bloqueado, que no llega a
// Supabase, contestaría más rápido y delataría el bloqueo.
const demoraConstante = (inicio: number) => new Promise((r) => setTimeout(r, Math.max(0, inicio + DEMORA_MS - Date.now())));

export async function entrar(_previo: EstadoLogin, datos: FormData): Promise<EstadoLogin> {
  const crudo = { usuario: String(datos.get('usuario') ?? ''), contrasena: String(datos.get('contrasena') ?? '') };
  const validado = esquema.safeParse(crudo);
  if (!validado.success) {
    const campos = z.flattenError(validado.error).fieldErrors;
    return {
      usuario: crudo.usuario,
      errores: { usuario: campos.usuario?.[0], contrasena: campos.contrasena?.[0] },
    };
  }

  const inicio = Date.now();
  const { usuario, contrasena } = validado.data;
  const encabezados = await headers();
  const ip = encabezados.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';

  if (bloqueado(ip, usuario)) {
    await demoraConstante(inicio);
    return { usuario, error: MENSAJE_GENERICO };
  }

  const cuenta = cuentaDe(usuario);
  if (!cuenta) {
    anotarFallo(ip, usuario);
    await demoraConstante(inicio);
    return { usuario, error: MENSAJE_GENERICO };
  }

  const supabase = await supabaseServidor();
  const { data, error } = await supabase.auth.signInWithPassword({ email: cuenta, password: contrasena });

  // El proyecto tiene usuarios de otras apps: con contraseña correcta pero fuera
  // del equipo se cierra la sesión recién abierta y se contesta igual que un error.
  let adentro = false;
  if (!error && data.user) {
    const { data: fila } = await supabase.from('fg_equipo').select('user_id').eq('user_id', data.user.id).maybeSingle();
    adentro = Boolean(fila);
    if (!adentro) await supabase.auth.signOut();
  }

  if (!adentro) {
    anotarFallo(ip, usuario);
    await demoraConstante(inicio);
    return { usuario, error: MENSAJE_GENERICO };
  }

  limpiarFallos(ip, usuario);
  redirect('/');
}

export async function cerrarSesion() {
  const supabase = await supabaseServidor();
  await supabase.auth.signOut();
  redirect('/login');
}
