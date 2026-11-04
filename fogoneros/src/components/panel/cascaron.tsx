'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Marca } from '@/components/ui/marca';
import { IconoChats, IconoContexto, IconoCuenta, IconoInicio, IconoWhatsapp } from '@/components/ui/iconos';

const SECCIONES = [
  { href: '/', texto: 'Inicio', Icono: IconoInicio },
  { href: '/chats', texto: 'Chats', Icono: IconoChats },
  { href: '/contexto', texto: 'Contexto', Icono: IconoContexto },
  { href: '/whatsapp', texto: 'WhatsApp', Icono: IconoWhatsapp },
];

const activa = (ruta: string, href: string) => (href === '/' ? ruta === '/' : ruta === href || ruta.startsWith(`${href}/`));

export function Cascaron({ banner, pieLateral, children }: { banner?: ReactNode; pieLateral?: ReactNode; children: ReactNode }) {
  const ruta = usePathname();
  const enConversacion = /^\/chats\/.+/.test(ruta);

  return (
    <div className="flex h-dvh">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-brasa focus:px-4 focus:py-2 focus:text-sobre-brasa"
      >
        Saltar al contenido
      </a>

      <aside className="hidden w-60 shrink-0 flex-col border-r border-linea bg-placa/70 md:flex">
        <Link href="/" aria-label="Fogoneros MW, ir a Inicio" className="m-3 rounded-lg px-2 py-3">
          <Marca />
        </Link>
        <nav aria-label="Secciones" className="flex flex-col gap-1 px-3">
          {SECCIONES.map(({ href, texto, Icono }) => {
            const actual = activa(ruta, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={actual ? 'page' : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-xl px-3 font-semibold transition-colors duration-150 ${
                  actual ? 'bg-alta text-tinta' : 'text-tinta-2 hover:bg-alta/60 hover:text-tinta'
                }`}
              >
                <Icono className={actual ? 'text-brasa-texto' : ''} />
                {texto}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto p-3">{pieLateral}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={`flex items-center justify-between border-b border-linea bg-placa/70 px-4 pt-[env(safe-area-inset-top)] md:hidden ${
            enConversacion ? 'hidden' : ''
          }`}
        >
          <Link href="/" aria-label="Fogoneros MW, ir a Inicio" className="-ml-1 rounded-lg px-1 py-2.5">
            <Marca tam={30} />
          </Link>
          <Link
            href="/cuenta"
            aria-label="Mi cuenta"
            className="-mr-2 grid size-11 place-items-center rounded-lg text-tinta-2"
          >
            <IconoCuenta />
          </Link>
        </header>

        {banner}

        <main id="contenido" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto outline-none">
          {children}
        </main>

        <nav
          aria-label="Secciones"
          className={`grid grid-cols-4 border-t border-linea bg-placa pb-[env(safe-area-inset-bottom)] md:hidden ${
            enConversacion ? 'hidden' : ''
          }`}
        >
          {SECCIONES.map(({ href, texto, Icono }) => {
            const actual = activa(ruta, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={actual ? 'page' : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-[0.9375rem] font-semibold ${
                  actual ? 'text-brasa-texto' : 'text-tinta-2'
                }`}
              >
                <Icono />
                {texto}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
