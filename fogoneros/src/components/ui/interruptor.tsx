'use client';

import { useId, type ReactNode } from 'react';

type Props = {
  activo: boolean;
  onCambio: (valor: boolean) => void;
  etiqueta: ReactNode;
  ayuda?: ReactNode;
  disabled?: boolean;
};

export function Interruptor({ activo, onCambio, etiqueta, ayuda, disabled }: Props) {
  const idEtiqueta = useId();
  const idAyuda = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-labelledby={idEtiqueta}
      aria-describedby={ayuda ? idAyuda : undefined}
      disabled={disabled}
      onClick={() => onCambio(!activo)}
      className="flex min-h-11 w-full items-center gap-3 rounded-lg text-left disabled:opacity-55"
    >
      <span
        aria-hidden="true"
        className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-150 ${
          activo ? 'border-brasa bg-brasa' : 'border-control bg-alta'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-[22px] rounded-full transition-transform duration-200 ease-salida ${
            activo ? 'translate-x-5 bg-sobre-brasa' : 'bg-tinta-2'
          }`}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span id={idEtiqueta} className="block font-semibold">
          {etiqueta}
        </span>
        {ayuda && (
          <span id={idAyuda} className="block text-base text-tinta-2">
            {ayuda}
          </span>
        )}
      </span>
    </button>
  );
}
