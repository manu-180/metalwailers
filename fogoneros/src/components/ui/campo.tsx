import { useId, type InputHTMLAttributes, type ReactNode, type Ref, type TextareaHTMLAttributes } from 'react';

const CLASE_CONTROL =
  'w-full rounded-xl border border-control bg-fondo/60 px-3.5 py-2.5 text-[1.0625rem] text-tinta placeholder:text-tinta-3 transition-colors duration-150 focus:border-brasa-texto aria-[invalid=true]:border-peligro';

type Base = { etiqueta: string; ayuda?: ReactNode; error?: string };

function Pie({ idAyuda, idError, ayuda, error }: { idAyuda: string; idError: string; ayuda?: ReactNode; error?: string }) {
  return (
    <>
      {ayuda && (
        <p id={idAyuda} className="mt-1 text-base text-tinta-2">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} role="alert" className="mt-1 text-base font-semibold text-peligro">
          {error}
        </p>
      )}
    </>
  );
}

function describir(idAyuda: string, idError: string, ayuda?: ReactNode, error?: string) {
  return [ayuda ? idAyuda : null, error ? idError : null].filter(Boolean).join(' ') || undefined;
}

export function Campo({
  etiqueta,
  ayuda,
  error,
  ref,
  ...resto
}: Base & InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  const id = useId();
  const idAyuda = useId();
  const idError = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block font-semibold">
        {etiqueta}
      </label>
      <input
        ref={ref}
        id={id}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describir(idAyuda, idError, ayuda, error)}
        className={`min-h-12 ${CLASE_CONTROL}`}
        {...resto}
      />
      <Pie idAyuda={idAyuda} idError={idError} ayuda={ayuda} error={error} />
    </div>
  );
}

export function CampoTexto({
  etiqueta,
  ayuda,
  error,
  ref,
  ...resto
}: Base & TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: Ref<HTMLTextAreaElement> }) {
  const id = useId();
  const idAyuda = useId();
  const idError = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block font-semibold">
        {etiqueta}
      </label>
      <textarea
        ref={ref}
        id={id}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describir(idAyuda, idError, ayuda, error)}
        className={`min-h-28 ${CLASE_CONTROL}`}
        {...resto}
      />
      <Pie idAyuda={idAyuda} idError={idError} ayuda={ayuda} error={error} />
    </div>
  );
}
