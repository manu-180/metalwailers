import type { Metadata } from 'next';
import Link from 'next/link';
import { claseBoton } from '@/components/ui/boton';
import { Marca } from '@/components/ui/marca';

export const metadata: Metadata = {
  title: 'No encontramos esta página',
  description: 'Esta página de Fogoneros MW no existe.',
};

export default function NoEncontrada() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4">
      <Marca />
      <h1 className="text-5xl font-bold">No encontramos esta página</h1>
      <p className="text-tinta-2">Puede que el link esté mal copiado.</p>
      <Link href="/" className={`${claseBoton()} self-start`}>
        Ir al inicio
      </Link>
    </main>
  );
}
