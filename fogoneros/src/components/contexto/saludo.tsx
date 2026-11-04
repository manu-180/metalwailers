'use client';

import { useRef, useState, useTransition } from 'react';
import { guardarSaludo } from '@/app/(panel)/contexto/acciones';
import { useAviso } from '@/components/ui/avisos';
import { Boton } from '@/components/ui/boton';
import { CampoTexto } from '@/components/ui/campo';

export function Saludo({ inicial }: { inicial: string }) {
  const avisar = useAviso();
  const [guardado, setGuardado] = useState(inicial);
  const [texto, setTexto] = useState(inicial);
  const [error, setError] = useState<string>();
  const [, iniciar] = useTransition();
  const ref = useRef<HTMLTextAreaElement>(null);
  const cambio = texto.trim() !== guardado.trim();

  function agregarNombre() {
    const el = ref.current;
    const desde = el?.selectionStart ?? texto.length;
    const hasta = el?.selectionEnd ?? texto.length;
    const nuevo = `${texto.slice(0, desde)}{nombre}${texto.slice(hasta)}`;
    setTexto(nuevo);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(desde + 8, desde + 8);
    });
  }

  function guardar() {
    const previo = guardado;
    const nuevo = texto.trim();
    if (!nuevo) {
      setError('Escribí el mensaje de bienvenida.');
      return;
    }
    setError(undefined);
    setGuardado(nuevo);
    avisar('ok', 'Primer mensaje guardado.');
    iniciar(async () => {
      const r = await guardarSaludo(nuevo);
      if (r.ok) return;
      setGuardado(previo);
      setError(r.error);
    });
  }

  return (
    <section className="placa rounded-2xl p-4">
      <h2 className="text-3xl font-bold">Primer mensaje</h2>
      <p className="mt-1 mb-3 text-tinta-2">Es lo primero que recibe alguien cuando escribe por primera vez.</p>
      <CampoTexto
        ref={ref}
        etiqueta="Mensaje"
        ayuda="Donde pongas {nombre} va el nombre del cliente."
        value={texto}
        maxLength={2000}
        error={error}
        onChange={(e) => setTexto(e.target.value)}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <Boton variante="secundario" onClick={agregarNombre}>
          Agregar nombre
        </Boton>
        <Boton onClick={guardar} disabled={!cambio}>
          Guardar
        </Boton>
      </div>
      <figure className="mt-4">
        <figcaption className="mb-1 font-semibold text-tinta-2">Así le llega a Juan</figcaption>
        <p className="w-fit max-w-full rounded-2xl rounded-br-md bg-bot px-3.5 py-2.5 whitespace-pre-wrap">
          {texto.replaceAll('{nombre}', 'Juan') || 'Todavía no hay mensaje.'}
        </p>
      </figure>
    </section>
  );
}
