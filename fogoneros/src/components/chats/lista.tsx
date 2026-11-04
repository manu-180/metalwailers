'use client';

import Link from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { chatsRecientes, masChats } from '@/app/(panel)/chats/acciones';
import { cuandoEnLista, nombreDeChat } from '@/components/formato';
import { useAviso } from '@/components/ui/avisos';
import { Boton } from '@/components/ui/boton';
import { useCanal } from '@/components/ui/tiempo-real';
import type { ChatVista } from '@/lib/queries';
import { useChats } from './marco';

type Filtro = 'todos' | 'atencion';

function ordenar(chats: ChatVista[]) {
  return [...chats].sort((a, b) => (b.ultimo_at ?? '').localeCompare(a.ultimo_at ?? ''));
}

function unir(base: ChatVista[], nuevos: ChatVista[]) {
  const mapa = new Map(base.map((c) => [c.id, c]));
  for (const c of nuevos) mapa.set(c.id, { ...mapa.get(c.id), ...c });
  return ordenar([...mapa.values()]);
}

const masViejo = (chats: ChatVista[]) => chats[chats.length - 1]?.ultimo_at ?? null;

export function ListaChats({ todos, atencion, porPagina }: { todos: ChatVista[]; atencion: ChatVista[]; porPagina: number }) {
  const avisar = useAviso();
  const activo = useSelectedLayoutSegment();
  const { registrar } = useChats();
  const [chats, setChats] = useState(() => unir(todos, atencion));
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [cursor, setCursor] = useState({ todos: masViejo(todos), atencion: masViejo(atencion) });
  const [hayMas, setHayMas] = useState({ todos: todos.length === porPagina, atencion: atencion.length === porPagina });
  const [cargando, iniciar] = useTransition();

  useEffect(() => {
    registrar((id, campos) => setChats((l) => l.map((c) => (c.id === id ? { ...c, ...campos } : c))));
    return () => registrar(null);
  }, [registrar]);

  useCanal(
    'fg-lista-chats',
    (canal) =>
      canal.on('postgres_changes', { event: '*', schema: 'public', table: 'fg_chats' }, (cambio) => {
        if (cambio.eventType === 'DELETE') {
          const id = (cambio.old as { id?: string }).id;
          setChats((l) => l.filter((c) => c.id !== id));
          return;
        }
        const fila = cambio.new as ChatVista;
        if (fila.ultimo_at) setChats((l) => unir(l, [fila]));
      }),
    async () => {
      const r = await chatsRecientes();
      if (r.ok) setChats((l) => unir(l, r.chats));
    },
  );

  const visibles = useMemo(() => (filtro === 'atencion' ? chats.filter((c) => c.atencion) : chats), [chats, filtro]);
  const cuantosAtencion = useMemo(() => chats.filter((c) => c.atencion).length, [chats]);

  function cargarMas() {
    const desde = cursor[filtro];
    if (!desde) return;
    iniciar(async () => {
      const r = await masChats(desde, filtro === 'atencion');
      if (!r.ok) {
        avisar('error', r.error);
        return;
      }
      setChats((l) => unir(l, r.chats));
      setCursor((c) => ({ ...c, [filtro]: masViejo(r.chats) ?? desde }));
      setHayMas((h) => ({ ...h, [filtro]: r.chats.length === porPagina }));
    });
  }

  const pestanas: { valor: Filtro; texto: string }[] = [
    { valor: 'todos', texto: 'Todos' },
    { valor: 'atencion', texto: cuantosAtencion > 0 ? `Para Claudia (${cuantosAtencion})` : 'Para Claudia' },
  ];

  return (
    <>
      <div className="sticky top-0 z-10 border-b border-linea bg-fondo/95 px-3 pt-3 pb-2">
        <p className="px-1 font-titulo text-4xl leading-none font-bold">Chats</p>
        <div role="group" aria-label="Filtrar chats" className="mt-2 flex gap-2">
          {pestanas.map((p) => (
            <button
              key={p.valor}
              type="button"
              aria-pressed={filtro === p.valor}
              onClick={() => setFiltro(p.valor)}
              className={`min-h-11 rounded-full border px-4 font-semibold transition-colors duration-150 ${
                filtro === p.valor ? 'border-tinta bg-tinta text-fondo' : 'border-control text-tinta-2'
              }`}
            >
              {p.texto}
            </button>
          ))}
        </div>
      </div>

      {visibles.length === 0 ? (
        <div className="px-4 py-10 text-center text-tinta-2">
          {filtro === 'atencion' ? (
            <p>Nadie está esperando a Claudia. Cuando el bot necesite ayuda, aparece acá.</p>
          ) : (
            <p>Todavía no escribió nadie. Las charlas de WhatsApp van a aparecer acá.</p>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-0.5 p-2">
          {visibles.map((c) => {
            const abierto = c.id === activo;
            const sinLeer = !abierto && c.no_leidos > 0;
            return (
              <li key={c.id}>
                <Link
                  href={`/chats/${c.id}`}
                  aria-current={abierto ? 'page' : undefined}
                  className={`block rounded-xl px-3 py-2.5 transition-colors duration-150 ${
                    abierto ? 'bg-alta' : 'hover:bg-alta/60'
                  }`}
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 font-semibold">{nombreDeChat(c)}</span>
                    <span
                      suppressHydrationWarning
                      className={`shrink-0 text-base ${sinLeer ? 'font-semibold text-brasa-texto' : 'text-tinta-2'}`}
                    >
                      {cuandoEnLista(c.ultimo_at)}
                    </span>
                  </span>
                  <span className="mt-0.5 flex items-start justify-between gap-3">
                    <span className="min-w-0 text-tinta-2">
                      {c.ultimo_autor === 'bot' && 'Bot: '}
                      {c.ultimo_autor === 'humano' && 'Vos: '}
                      {c.ultimo_preview}
                    </span>
                    {sinLeer && (
                      <span className="grid h-6 min-w-6 shrink-0 place-items-center rounded-full bg-brasa px-1.5 text-base font-bold text-sobre-brasa">
                        <span className="sr-only">Sin leer: </span>
                        {c.no_leidos}
                      </span>
                    )}
                  </span>
                  {c.atencion && (
                    <span className="mt-1.5 inline-flex rounded-md bg-brasa-fondo px-2 py-0.5 text-base font-semibold text-brasa-texto">
                      Para Claudia
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {hayMas[filtro] && (
        <div className="px-3 pb-4">
          <Boton variante="secundario" className="w-full" onClick={cargarMas} disabled={cargando}>
            {cargando ? 'Trayendo…' : 'Cargar más'}
          </Boton>
        </div>
      )}
    </>
  );
}
