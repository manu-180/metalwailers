'use client';

import { Boton } from '@/components/ui/boton';

export default function ErrorPanel({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-14">
      <h1 className="text-5xl font-bold">No pudimos cargar esta pantalla</h1>
      <p className="text-tinta-2">Puede ser un corte de internet. Lo que ya estaba guardado sigue guardado.</p>
      <Boton onClick={() => retry()} className="self-start">
        Probar de nuevo
      </Boton>
    </div>
  );
}
