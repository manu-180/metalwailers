'use client';

import { useState, useTransition } from 'react';
import { borrarEntrada, cambiarUsoEntrada, crearEntrada, editarEntrada } from '@/app/(panel)/contexto/acciones';
import { useAviso } from '@/components/ui/avisos';
import { Boton } from '@/components/ui/boton';
import { Campo, CampoTexto } from '@/components/ui/campo';
import { Confirmar } from '@/components/ui/dialogo';
import { IconoMas } from '@/components/ui/iconos';
import { Interruptor } from '@/components/ui/interruptor';
import type { ContextoVista } from '@/lib/queries';

const falta = (e: ContextoVista) => !e.contenido.trim();

const ordenar = (lista: ContextoVista[]) =>
  [...lista].sort((a, b) => Number(falta(b)) - Number(falta(a)) || a.orden - b.orden);

type Borrador = { titulo: string; contenido: string; error?: string };

export function LoQueSabe({ inicial }: { inicial: ContextoVista[] }) {
  const avisar = useAviso();
  const [lista, setLista] = useState(inicial);
  const [editando, setEditando] = useState<string | 'nueva' | null>(null);
  const [borrador, setBorrador] = useState<Borrador>({ titulo: '', contenido: '' });
  const [aBorrar, setABorrar] = useState<ContextoVista | null>(null);
  const [, iniciar] = useTransition();

  const visibles = ordenar(lista);

  function abrir(e: ContextoVista) {
    setEditando(e.id);
    setBorrador({ titulo: e.titulo, contenido: e.contenido });
  }

  function nueva() {
    setEditando('nueva');
    setBorrador({ titulo: '', contenido: '' });
  }

  function validar() {
    const titulo = borrador.titulo.trim();
    if (!titulo) {
      setBorrador((b) => ({ ...b, error: 'Ponele un título.' }));
      return null;
    }
    return { titulo, contenido: borrador.contenido.trim() };
  }

  function guardarEdicion(e: ContextoVista) {
    const campos = validar();
    if (!campos) return;
    // Lo que estaba vacío arrancó apagado: si ahora tiene texto, recién ahí tiene sentido usarlo.
    const activo = falta(e) && campos.contenido ? true : e.activo;
    const nuevo = { ...e, ...campos, activo };
    const previo = lista;
    const borradorPrevio = borrador;
    setLista((l) => l.map((x) => (x.id === e.id ? nuevo : x)));
    setEditando(null);
    iniciar(async () => {
      const r = await editarEntrada(e.id, { ...campos, activo });
      if (r.ok) return;
      setLista(previo);
      setEditando(e.id);
      setBorrador({ ...borradorPrevio, error: r.error });
    });
  }

  function guardarNueva() {
    const campos = validar();
    if (!campos) return;
    const orden = Math.max(0, ...lista.map((x) => x.orden)) + 10;
    const temporal: ContextoVista = { id: `temp-${crypto.randomUUID()}`, ...campos, orden, activo: true };
    const borradorPrevio = borrador;
    setLista((l) => [...l, temporal]);
    setEditando(null);
    iniciar(async () => {
      const r = await crearEntrada({ ...campos, orden, activo: Boolean(campos.contenido) });
      if (r.ok) {
        setLista((l) => l.map((x) => (x.id === temporal.id ? r.fila : x)));
        return;
      }
      setLista((l) => l.filter((x) => x.id !== temporal.id));
      setEditando('nueva');
      setBorrador({ ...borradorPrevio, error: r.error });
    });
  }

  function cambiarUso(e: ContextoVista, activo: boolean) {
    setLista((l) => l.map((x) => (x.id === e.id ? { ...x, activo } : x)));
    iniciar(async () => {
      const r = await cambiarUsoEntrada(e.id, activo);
      if (r.ok) return;
      setLista((l) => l.map((x) => (x.id === e.id ? { ...x, activo: e.activo } : x)));
      avisar('error', r.error);
    });
  }

  function borrar() {
    const e = aBorrar;
    if (!e) return;
    setABorrar(null);
    setLista((l) => l.filter((x) => x.id !== e.id));
    iniciar(async () => {
      const r = await borrarEntrada(e.id);
      if (r.ok) return;
      setLista((l) => [...l, e]);
      avisar('error', r.error);
    });
  }

  const formulario = (alGuardar: () => void) => (
    <div className="flex flex-col gap-3">
      <Campo
        etiqueta="Título"
        value={borrador.titulo}
        maxLength={120}
        error={borrador.error}
        onChange={(ev) => setBorrador((b) => ({ ...b, titulo: ev.target.value, error: undefined }))}
      />
      <CampoTexto
        etiqueta="Qué tiene que saber el bot"
        ayuda="Escribilo como se lo contarías a alguien nuevo en el local."
        value={borrador.contenido}
        maxLength={8000}
        onChange={(ev) => setBorrador((b) => ({ ...b, contenido: ev.target.value }))}
      />
      <div className="flex flex-wrap gap-2">
        <Boton onClick={alGuardar}>Guardar</Boton>
        <Boton variante="fantasma" onClick={() => setEditando(null)}>
          Cancelar
        </Boton>
      </div>
    </div>
  );

  return (
    <section>
      <h2 className="text-3xl font-bold">Lo que sabe el bot</h2>
      <p className="mt-1 mb-3 text-tinta-2">Cada tarjeta es un tema que el bot puede usar para contestar.</p>

      <ul className="flex flex-col gap-3">
        {visibles.map((e) => (
          <li
            key={e.id}
            className={`rounded-2xl p-4 ${falta(e) ? 'border border-brasa/60 bg-brasa-fondo' : 'placa'}`}
          >
            {editando === e.id ? (
              formulario(() => guardarEdicion(e))
            ) : (
              <>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <h3 className="text-2xl font-bold">{e.titulo}</h3>
                  {falta(e) && <span className="font-semibold text-brasa-texto">Falta completar</span>}
                </div>
                {falta(e) ? (
                  <p className="mt-1 text-tinta-2">El bot todavía no sabe nada de este tema.</p>
                ) : (
                  <>
                    <p className="mt-1 whitespace-pre-wrap text-tinta-2">{e.contenido}</p>
                    <div className="mt-2">
                      <Interruptor
                        activo={e.activo}
                        onCambio={(v) => cambiarUso(e, v)}
                        etiqueta={e.activo ? 'El bot lo usa' : 'El bot no lo usa'}
                        disabled={e.id.startsWith('temp-')}
                      />
                    </div>
                  </>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Boton variante={falta(e) ? 'primario' : 'secundario'} disabled={e.id.startsWith('temp-')} onClick={() => abrir(e)}>
                    {falta(e) ? 'Completar' : 'Editar'}
                  </Boton>
                  <Boton variante="fantasma" disabled={e.id.startsWith('temp-')} onClick={() => setABorrar(e)}>
                    Borrar
                  </Boton>
                </div>
              </>
            )}
          </li>
        ))}
        {editando === 'nueva' && <li className="placa rounded-2xl p-4">{formulario(guardarNueva)}</li>}
      </ul>

      {editando !== 'nueva' && (
        <Boton variante="secundario" className="mt-3" onClick={nueva}>
          <IconoMas />
          Agregar tema
        </Boton>
      )}

      <Confirmar
        abierto={aBorrar !== null}
        titulo="¿Borrar este tema?"
        mensaje={`El bot deja de saber lo que dice “${aBorrar?.titulo ?? ''}” y el texto se pierde.`}
        accion="Borrar tema"
        onConfirmar={borrar}
        onCancelar={() => setABorrar(null)}
      />
    </section>
  );
}
