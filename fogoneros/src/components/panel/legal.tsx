import Link from 'next/link';
import type { ReactNode } from 'react';
import { Marca } from '@/components/ui/marca';

export function PaginaLegal({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 [caret-color:transparent]">
      <Link href="/" aria-label="Fogoneros MW, ir al inicio" className="inline-flex min-h-11 items-center rounded-lg">
        <Marca />
      </Link>
      <main className="mt-6 flex flex-col gap-3 [&_h2]:mt-4 [&_h2]:text-3xl [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_p]:text-tinta-2 [&_ul]:text-tinta-2">
        <h1 className="text-5xl font-bold">{titulo}</h1>
        {children}
      </main>
    </div>
  );
}
