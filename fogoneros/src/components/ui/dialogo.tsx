'use client';

import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from 'react';
import { Boton } from '@/components/ui/boton';
import { IconoCruz } from '@/components/ui/iconos';

type Props = {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  descripcion?: string;
  children?: ReactNode;
  pie?: ReactNode;
  forma?: 'dialogo' | 'hoja';
};

// <dialog> nativo: ya trae foco atrapado, Esc y el resto de la página inerte.
export function Dialogo({ abierto, onCerrar, titulo, descripcion, children, pie, forma = 'dialogo' }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();
  const idDescripcion = useId();
  const cerrarRef = useRef(onCerrar);

  useEffect(() => {
    cerrarRef.current = onCerrar;
  }, [onCerrar]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  // Cache Components oculta la ruta con <Activity> en vez de desmontarla: sin esto
  // el diálogo reaparece abierto al volver a la pantalla.
  useLayoutEffect(() => () => cerrarRef.current(), []);

  return (
    <dialog
      ref={ref}
      className={forma}
      aria-labelledby={idTitulo}
      aria-describedby={descripcion ? idDescripcion : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onCerrar();
      }}
    >
      <div className={`flex flex-col ${forma === 'hoja' ? 'h-full max-h-[90dvh] md:max-h-dvh' : ''}`}>
        <header className="flex items-start gap-3 border-b border-linea px-5 pt-5 pb-4">
          <div className="min-w-0 flex-1">
            <h2 id={idTitulo} className="text-3xl font-bold">
              {titulo}
            </h2>
            {descripcion && (
              <p id={idDescripcion} className="mt-1 text-tinta-2">
                {descripcion}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="-mt-2 -mr-2 grid size-11 shrink-0 place-items-center rounded-lg text-tinta-2 hover:bg-alta"
          >
            <IconoCruz />
          </button>
        </header>
        {children && <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>}
        {pie && (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-linea px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            {pie}
          </footer>
        )}
      </div>
    </dialog>
  );
}

type PropsConfirmar = {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  accion: string;
  onConfirmar: () => void;
  onCancelar: () => void;
};

export function Confirmar({ abierto, titulo, mensaje, accion, onConfirmar, onCancelar }: PropsConfirmar) {
  return (
    <Dialogo
      abierto={abierto}
      onCerrar={onCancelar}
      titulo={titulo}
      descripcion={mensaje}
      pie={
        <>
          <Boton variante="secundario" autoFocus onClick={onCancelar}>
            Cancelar
          </Boton>
          <Boton variante="peligro" onClick={onConfirmar}>
            {accion}
          </Boton>
        </>
      }
    />
  );
}
