'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { IconoCruz } from '@/components/ui/iconos';

type Tono = 'ok' | 'error';
type Aviso = { id: number; tono: Tono; texto: string };
type Avisar = (tono: Tono, texto: string) => void;

const Ctx = createContext<Avisar>(() => {});

export const useAviso = () => useContext(Ctx);

export function ProveedorAvisos({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const siguiente = useRef(1);

  const sacar = useCallback((id: number) => setAvisos((a) => a.filter((x) => x.id !== id)), []);

  const avisar = useCallback<Avisar>(
    (tono, texto) => {
      const id = siguiente.current++;
      setAvisos((a) => [...a.slice(-2), { id, tono, texto }]);
      setTimeout(() => sacar(id), tono === 'error' ? 8000 : 5000);
    },
    [sacar],
  );

  const valor = useMemo(() => avisar, [avisar]);

  return (
    <Ctx.Provider value={valor}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 flex flex-col items-center gap-2 md:inset-x-auto md:right-6 md:bottom-6 md:items-end"
        role="status"
        aria-live="polite"
      >
        {avisos.map((a) => (
          <div
            key={a.id}
            className={`pointer-events-auto flex w-full max-w-md animate-entra items-start gap-2 rounded-xl border px-4 py-3 shadow-[0_12px_30px_-14px_rgb(0_0_0/0.9)] ${
              a.tono === 'error'
                ? 'border-peligro/50 bg-peligro-fondo text-tinta'
                : 'border-linea bg-alta text-tinta'
            }`}
          >
            <p className="flex-1">{a.texto}</p>
            <button
              type="button"
              onClick={() => sacar(a.id)}
              aria-label="Cerrar aviso"
              className="-my-2 -mr-2 grid size-11 shrink-0 place-items-center rounded-lg text-tinta-2"
            >
              <IconoCruz />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
