'use client';

import { useState, useTransition } from 'react';
import { desactivarNota } from '@/app/(panel)/chats/acciones';
import { fechaConHora } from '@/components/formato';
import { useAviso } from '@/components/ui/avisos';
import { Boton } from '@/components/ui/boton';
import type { NotaVista } from '@/lib/queries';

export function Notas({ inicial }: { inicial: NotaVista[] }) {
  const avisar = useAviso();
  const [notas, setNotas] = useState(inicial);
  const [previo, setPrevio] = useState(inicial);
  const [, iniciar] = useTransition();
  if (inicial !== previo) {
    setPrevio(inicial);
    setNotas(inicial);
  }

  function dejar(n: NotaVista) {
    setNotas((l) => l.filter((x) => x.id !== n.id));
    iniciar(async () => {
      const r = await desactivarNota(n.id);
      if (r.ok) return;
      setNotas((l) => [n, ...l]);
      avisar('error', r.error);
    });
  }

  return (
    <section>
      <h2 className="text-3xl font-bold">Lo que le fuiste enseñando</h2>
      {notas.length === 0 ? (
        <p className="mt-1 text-tinta-2">
          Todavía no hay notas. En Chats, tocá una respuesta del bot y contale qué cambiarías.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {notas.map((n) => (
            <li key={n.id} className="placa rounded-2xl p-4">
              <blockquote className="rounded-xl bg-bot px-3 py-2 whitespace-pre-wrap">{n.respuesta}</blockquote>
              <p className="mt-2">{n.por_que}</p>
              {n.como && <p className="mt-1 border-l-2 border-control pl-2.5 text-tinta-2">{n.como}</p>}
              <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3">
                <span className="text-base text-tinta-2">
                  {[n.autor, fechaConHora(n.creado)].filter(Boolean).join(' · ')}
                </span>
                <Boton variante="fantasma" className="-mr-2" onClick={() => dejar(n)}>
                  Dejar de aplicar
                </Boton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
