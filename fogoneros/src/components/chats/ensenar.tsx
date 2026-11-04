'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, useTransition, type ReactNode } from 'react';
import { desactivarNota, guardarNota } from '@/app/(panel)/chats/acciones';
import { fechaConHora } from '@/components/formato';
import { useAviso } from '@/components/ui/avisos';
import { Boton } from '@/components/ui/boton';
import { CampoTexto } from '@/components/ui/campo';
import { Dialogo } from '@/components/ui/dialogo';
import type { NotaVista } from '@/lib/queries';

type Abierto = { mensajeId: string; texto: string };
type Ctx = { notasDe: (mensajeId: string) => NotaVista[]; abrir: (a: Abierto) => void };

const CtxEnsenar = createContext<Ctx | null>(null);

export function useEnsenar() {
  const ctx = useContext(CtxEnsenar);
  if (!ctx) throw new Error('useEnsenar fuera del proveedor');
  return ctx;
}

const VACIO = { porQue: '', como: '' };

export function ProveedorEnsenar({ notasIniciales, children }: { notasIniciales: NotaVista[]; children: ReactNode }) {
  const avisar = useAviso();
  const [notas, setNotas] = useState(notasIniciales);
  const [abierto, setAbierto] = useState<Abierto | null>(null);
  const [visible, setVisible] = useState(false);
  const [borrador, setBorrador] = useState(VACIO);
  const [error, setError] = useState<string>();
  const [, iniciar] = useTransition();
  const motivoRef = useRef<HTMLTextAreaElement>(null);

  const porMensaje = useMemo(() => {
    const mapa = new Map<string, NotaVista[]>();
    for (const n of notas) {
      if (n.mensaje_id) mapa.set(n.mensaje_id, [...(mapa.get(n.mensaje_id) ?? []), n]);
    }
    return mapa;
  }, [notas]);

  const abrir = useCallback((a: Abierto) => {
    setAbierto(a);
    setBorrador(VACIO);
    setError(undefined);
    setVisible(true);
    requestAnimationFrame(() => motivoRef.current?.focus());
  }, []);

  const ctx = useMemo<Ctx>(() => ({ notasDe: (id) => porMensaje.get(id) ?? [], abrir }), [porMensaje, abrir]);

  function guardar() {
    if (!abierto) return;
    const porQue = borrador.porQue.trim();
    if (!porQue) {
      setError('Contale qué no te gustó de la respuesta.');
      motivoRef.current?.focus();
      return;
    }
    const como = borrador.como.trim();
    const temporal: NotaVista = {
      id: `temp-${Date.now()}`,
      mensaje_id: abierto.mensajeId,
      chat_id: null,
      respuesta: abierto.texto,
      por_que: porQue,
      como: como || null,
      activa: true,
      autor: null,
      creado: new Date().toISOString(),
    };
    const destino = abierto;
    const borradorPrevio = borrador;
    setNotas((n) => [...n, temporal]);
    setVisible(false);
    avisar('ok', 'Anotado. Desde la próxima respuesta el bot ya lo tiene en cuenta.');
    iniciar(async () => {
      const r = await guardarNota(destino.mensajeId, porQue, como);
      if (r.ok) {
        setNotas((n) => n.map((x) => (x.id === temporal.id ? r.nota : x)));
        return;
      }
      setNotas((n) => n.filter((x) => x.id !== temporal.id));
      setAbierto(destino);
      setBorrador(borradorPrevio);
      setError(r.error);
      setVisible(true);
      avisar('error', 'No se guardó la nota. Quedó tu borrador para probar de nuevo.');
    });
  }

  function dejarDeAplicar(nota: NotaVista) {
    setNotas((n) => n.filter((x) => x.id !== nota.id));
    iniciar(async () => {
      const r = await desactivarNota(nota.id);
      if (r.ok) return;
      setNotas((n) => [...n, nota]);
      avisar('error', r.error);
    });
  }

  const previas = abierto ? (porMensaje.get(abierto.mensajeId) ?? []) : [];

  return (
    <CtxEnsenar.Provider value={ctx}>
      {children}
      <Dialogo
        forma="hoja"
        abierto={visible}
        onCerrar={() => setVisible(false)}
        titulo="Enseñarle al bot"
        descripcion="Lo que anotes vale para todos los chats, desde la próxima respuesta."
        pie={
          <>
            <Boton variante="fantasma" onClick={() => setVisible(false)}>
              Cancelar
            </Boton>
            <Boton onClick={guardar}>Guardar nota</Boton>
          </>
        }
      >
        {abierto && (
          <div className="flex flex-col gap-5">
            <figure>
              <figcaption className="mb-1 font-semibold text-tinta-2">Lo que respondió</figcaption>
              <blockquote className="max-h-48 overflow-y-auto rounded-xl bg-bot px-3.5 py-2.5 whitespace-pre-wrap">
                {abierto.texto}
              </blockquote>
            </figure>

            {previas.length > 0 && (
              <section aria-label="Notas que ya dejaste">
                <h3 className="mb-2 text-2xl font-bold">{previas.length === 1 ? 'Ya tiene esta nota' : `Ya tiene ${previas.length} notas`}</h3>
                <ul className="flex flex-col gap-2">
                  {previas.map((n) => (
                    <li key={n.id} className="rounded-xl border border-linea bg-alta/50 px-3.5 py-2.5">
                      <p>{n.por_que}</p>
                      {n.como && <p className="mt-1 border-l-2 border-control pl-2.5 text-tinta-2">{n.como}</p>}
                      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3">
                        <span className="text-base text-tinta-2">
                          {[n.autor, fechaConHora(n.creado)].filter(Boolean).join(' · ')}
                        </span>
                        <Boton
                          variante="fantasma"
                          className="-mr-2"
                          disabled={n.id.startsWith('temp-')}
                          onClick={() => dejarDeAplicar(n)}
                        >
                          Dejar de aplicar
                        </Boton>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <CampoTexto
              ref={motivoRef}
              etiqueta="Qué no te gustó"
              ayuda="Contale el porqué: eso es lo que el bot aprende para otros chats."
              required
              maxLength={1500}
              value={borrador.porQue}
              error={error}
              onChange={(e) => {
                setBorrador((b) => ({ ...b, porQue: e.target.value }));
                if (error) setError(undefined);
              }}
            />
            <CampoTexto
              etiqueta="Cómo tendría que haber respondido"
              ayuda="Opcional. Escribilo como lo mandarías vos."
              maxLength={2000}
              value={borrador.como}
              onChange={(e) => setBorrador((b) => ({ ...b, como: e.target.value }))}
            />
          </div>
        )}
      </Dialogo>
    </CtxEnsenar.Provider>
  );
}
