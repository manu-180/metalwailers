import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function supabaseServidor() {
  const almacen = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => almacen.getAll(),
        setAll(lista) {
          // En un Server Component las cookies no se pueden escribir: el refresco
          // de la sesión lo hace proxy.ts en cada pedido.
          try {
            for (const { name, value, options } of lista) almacen.set(name, value, options);
          } catch {}
        },
      },
    },
  );
}
