'use client';

import './globals.css';

export default function ErrorGlobal({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="es">
      <head>
        <title>Algo no anduvo · Fogoneros MW</title>
      </head>
      <body>
        <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4">
          <h1 className="text-5xl font-bold">Algo no anduvo</h1>
          <p className="text-tinta-2">Probá de nuevo y, si sigue, avisale a Manu.</p>
          <button
            type="button"
            onClick={() => retry()}
            className="min-h-11 self-start rounded-xl bg-brasa px-4 font-semibold text-sobre-brasa"
          >
            Probar de nuevo
          </button>
        </main>
      </body>
    </html>
  );
}
