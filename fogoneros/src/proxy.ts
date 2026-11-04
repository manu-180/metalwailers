import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLICAS = ['/login', '/privacidad', '/terminos'];

export async function proxy(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(lista, encabezados) {
          for (const { name, value } of lista) request.cookies.set(name, value);
          respuesta = NextResponse.next({ request });
          for (const { name, value, options } of lista) respuesta.cookies.set(name, value, options);
          for (const [clave, valor] of Object.entries(encabezados ?? {})) respuesta.headers.set(clave, valor);
        },
      },
    },
  );

  // getClaims es lo que refresca el token vencido: va siempre, aunque la ruta sea pública.
  const { data } = await supabase.auth.getClaims();
  const conSesion = Boolean(data?.claims?.sub);
  const ruta = request.nextUrl.pathname;
  const esPublica = PUBLICAS.some((p) => ruta === p || ruta.startsWith(`${p}/`));

  if ((!conSesion && !esPublica) || (conSesion && ruta === '/login')) {
    const destino = request.nextUrl.clone();
    destino.pathname = conSesion ? '/' : '/login';
    destino.search = '';
    return NextResponse.redirect(destino);
  }

  return respuesta;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|api/webhook|api/cron|favicon\\.ico|icon|apple-icon|opengraph-image|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|webp|ico|txt)$).*)',
  ],
};
