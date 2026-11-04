'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { cuandoEnLista, nombreDeChat } from '@/components/formato';
import { IconoFlecha } from '@/components/ui/iconos';
import { useCanal } from '@/components/ui/tiempo-real';
import type { ChatVista } from '@/lib/queries';

export function ParaClaudia({ inicial }: { inicial: ChatVista[] }) {
  const router = useRouter();
  const [lista, setLista] = useState(inicial);
  const [previo, setPrevio] = useState(inicial);
  if (inicial !== previo) {
    setPrevio(inicial);
    setLista(inicial);
  }

  useCanal(
    'fg-inicio-chats',
    (canal) =>
      canal.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'fg_chats' }, (cambio) => {
        const fila = cambio.new as ChatVista;
        setLista((l) => {
          const sin = l.filter((c) => c.id !== fila.id);
          return fila.atencion ? [fila, ...sin] : sin;
        });
      }),
    () => router.refresh(),
  );

  if (lista.length === 0) return null;

  return (
    <section className="rounded-2xl border border-brasa/50 bg-brasa-fondo p-4">
      <h2 className="text-3xl font-bold text-brasa-texto">Para Claudia</h2>
      <p className="text-tinta-2">{lista.length === 1 ? 'Una persona espera' : `${lista.length} personas esperan`} que la atiendas.</p>
      <ul className="mt-3 flex flex-col gap-2">
        {lista.map((c) => (
          <li key={c.id}>
            <Link
              href={`/chats/${c.id}`}
              className="flex min-h-14 items-center gap-3 rounded-xl bg-fondo/50 px-3 py-2.5 transition-colors duration-150 hover:bg-fondo/80"
            >
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-semibold">{nombreDeChat(c)}</span>
                  <span className="text-base text-tinta-2">{cuandoEnLista(c.ultimo_at)}</span>
                </span>
                {c.atencion_motivo && <span className="block text-tinta-2">{c.atencion_motivo}</span>}
              </span>
              <IconoFlecha className="shrink-0 text-brasa-texto" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
