import 'server-only';
import { cache } from 'react';
import { supabaseServidor } from '@/lib/supabase/server';

export type Acceso =
  | { estado: 'fuera' }
  | { estado: 'ajeno' }
  | { estado: 'ok'; userId: string; nombre: string };

// El proyecto de Supabase lo comparten otras apps: tener sesión no alcanza, hay
// que estar en fg_equipo. React.cache evita repetir la consulta entre layout y página.
export const accesoActual = cache(async (): Promise<Acceso> => {
  const supabase = await supabaseServidor();
  const { data: reclamos } = await supabase.auth.getClaims();
  const userId = reclamos?.claims?.sub;
  if (!userId) return { estado: 'fuera' };
  const { data } = await supabase.from('fg_equipo').select('nombre').eq('user_id', userId).maybeSingle();
  if (!data) return { estado: 'ajeno' };
  return { estado: 'ok', userId, nombre: data.nombre };
});

// Un Server Action es un endpoint público: valida contra el servidor de Auth,
// no alcanza con leer la cookie.
export async function exigirEquipo() {
  const supabase = await supabaseServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false as const, error: 'Se venció la sesión. Volvé a entrar.' };
  const [{ data: esEquipo, error }, { data: fila }] = await Promise.all([
    supabase.rpc('fg_es_equipo'),
    supabase.from('fg_equipo').select('nombre').eq('user_id', auth.user.id).maybeSingle(),
  ]);
  if (error || !esEquipo) return { ok: false as const, error: 'Tu usuario no tiene acceso a este panel.' };
  return { ok: true as const, supabase, nombre: (fila?.nombre as string | undefined) ?? 'Equipo' };
}
