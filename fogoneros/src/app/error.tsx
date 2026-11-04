'use client';

import { Boton } from '@/components/ui/boton';

export default function ErrorGeneral({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4">
      <h1 className="text-5xl font-bold">Algo no anduvo</h1>
      <p className="text-tinta-2">Puede ser un corte de internet. Probá de nuevo y, si sigue, avisale a Manu.</p>
      <Boton onClick={() => retry()} className="self-start">
        Probar de nuevo
      </Boton>
    </main>
  );
}
