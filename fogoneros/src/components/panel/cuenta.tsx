import Link from 'next/link';
import type { ReactNode } from 'react';
import { cerrarSesion } from '@/app/login/acciones';
import { claseBoton } from '@/components/ui/boton';
import { IconoCuenta } from '@/components/ui/iconos';
import { Marca } from '@/components/ui/marca';

export function CerrarSesion({ ancho = false }: { ancho?: boolean }) {
  return (
    <form action={cerrarSesion}>
      <button type="submit" className={`${claseBoton('secundario')} ${ancho ? 'w-full' : ''}`}>
        Cerrar sesión
      </button>
    </form>
  );
}

export function PieLateral({ nombre }: { nombre: string }) {
  return (
    <Link
      href="/cuenta"
      className="flex min-h-12 items-center gap-3 rounded-xl px-3 font-semibold text-tinta-2 transition-colors duration-150 hover:bg-alta/60 hover:text-tinta"
    >
      <IconoCuenta />
      {nombre}
    </Link>
  );
}

export function SinAcceso({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 px-4">
      <Marca />
      <h1 className="text-5xl font-bold">Este usuario no tiene acceso</h1>
      <p className="text-tinta-2">Pedile a Manu que te habilite. Mientras tanto podés salir y entrar con otro usuario.</p>
      {children}
    </main>
  );
}
