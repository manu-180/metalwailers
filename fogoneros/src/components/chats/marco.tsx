'use client';

import { useSelectedLayoutSegment } from 'next/navigation';
import { createContext, useContext, useMemo, useRef, type ReactNode } from 'react';
import type { ChatVista } from '@/lib/queries';

type Parchar = (id: string, campos: Partial<ChatVista>) => void;
type Ctx = { parchar: Parchar; registrar: (fn: Parchar | null) => void };

const CtxChats = createContext<Ctx | null>(null);

export function useChats() {
  const ctx = useContext(CtxChats);
  if (!ctx) throw new Error('useChats fuera de MarcoChats');
  return ctx;
}

// La lista y la conversación viven en Suspense distintos y ninguna espera a la otra:
// la conversación le avisa a la lista por este ref lo que cambió de forma optimista.
export function MarcoChats({ lista, children }: { lista: ReactNode; children: ReactNode }) {
  const segmento = useSelectedLayoutSegment();
  const oyente = useRef<Parchar | null>(null);

  const ctx = useMemo<Ctx>(
    () => ({
      parchar: (id, campos) => oyente.current?.(id, campos),
      registrar: (fn) => {
        oyente.current = fn;
      },
    }),
    [],
  );

  return (
    <CtxChats.Provider value={ctx}>
      <div className="flex h-full min-h-0">
        <div
          className={`h-full w-full shrink-0 flex-col overflow-y-auto border-linea lg:flex lg:w-96 lg:border-r ${
            segmento ? 'hidden' : 'flex'
          }`}
        >
          {lista}
        </div>
        <div className={`h-full min-w-0 flex-1 ${segmento ? '' : 'sr-only lg:not-sr-only'}`}>{children}</div>
      </div>
    </CtxChats.Provider>
  );
}
