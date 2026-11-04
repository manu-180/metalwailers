'use client';

import { useEffect, useRef, useState, useTransition, type ChangeEvent } from 'react';
import { guardarAudio, pedirSubidaAudio, sacarAudio } from '@/app/(panel)/contexto/acciones';
import { tiempoGrabado } from '@/components/formato';
import { useAviso } from '@/components/ui/avisos';
import { Boton, claseBoton } from '@/components/ui/boton';
import { Confirmar } from '@/components/ui/dialogo';
import { IconoFrenar, IconoMicrofono, IconoSubir } from '@/components/ui/iconos';
import { supabaseNavegador } from '@/lib/supabase/cliente';
import { BUCKET } from '@/lib/tipos';

const MAX_BYTES = 16 * 1024 * 1024;
const MAX_SEGUNDOS = 300;
const FORMATOS = ['audio/ogg;codecs=opus', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'];

type Actual = { nombre: string | null; url: string | null };
type Borrador = { blob: Blob; url: string; nombre: string };

export function AudioBienvenida({ inicial }: { inicial: Actual | null }) {
  const avisar = useAviso();
  const [actual, setActual] = useState(inicial);
  const [borrador, setBorrador] = useState<Borrador | null>(null);
  const [grabando, setGrabando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [error, setError] = useState<string>();
  const [confirmar, setConfirmar] = useState(false);
  const [subiendo, iniciar] = useTransition();
  const grabadora = useRef<MediaRecorder | null>(null);
  const reloj = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (reloj.current) clearInterval(reloj.current);
      if (grabadora.current?.state === 'recording') grabadora.current.stop();
    },
    [],
  );

  function ponerBorrador(blob: Blob, nombre: string) {
    if (borrador) URL.revokeObjectURL(borrador.url);
    setBorrador({ blob, nombre, url: URL.createObjectURL(blob) });
  }

  function descartar() {
    if (borrador) URL.revokeObjectURL(borrador.url);
    setBorrador(null);
    setError(undefined);
  }

  function frenar() {
    if (reloj.current) clearInterval(reloj.current);
    reloj.current = null;
    grabadora.current?.stop();
    setGrabando(false);
  }

  async function grabar() {
    setError(undefined);
    let canal: MediaStream;
    try {
      canal = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      const nombre = e instanceof DOMException ? e.name : '';
      setError(
        nombre === 'NotFoundError'
          ? 'No encontramos un micrófono en este equipo. Probá desde el celular o cargá un archivo.'
          : 'El navegador no nos dejó usar el micrófono. Habilitalo y probá de nuevo.',
      );
      return;
    }
    const formato = FORMATOS.find((f) => MediaRecorder.isTypeSupported(f));
    const r = new MediaRecorder(canal, formato ? { mimeType: formato } : undefined);
    const partes: Blob[] = [];
    r.ondataavailable = (e) => {
      if (e.data.size > 0) partes.push(e.data);
    };
    r.onstop = () => {
      canal.getTracks().forEach((t) => t.stop());
      const blob = new Blob(partes, { type: r.mimeType.split(';')[0] });
      if (blob.size > 0) ponerBorrador(blob, 'Audio grabado desde el panel');
    };
    grabadora.current = r;
    r.start();
    descartarSinTocarError();
    setSegundos(0);
    setGrabando(true);
    let transcurridos = 0;
    reloj.current = setInterval(() => {
      transcurridos += 1;
      setSegundos(transcurridos);
      if (transcurridos >= MAX_SEGUNDOS) frenar();
    }, 1000);
  }

  function descartarSinTocarError() {
    if (borrador) URL.revokeObjectURL(borrador.url);
    setBorrador(null);
  }

  function alElegir(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    if (!archivo.type.startsWith('audio/')) {
      setError('Ese archivo no es un audio.');
      return;
    }
    if (archivo.size > MAX_BYTES) {
      setError('El audio pesa más de 16 MB. Probá con uno más corto.');
      return;
    }
    setError(undefined);
    ponerBorrador(archivo, archivo.name);
  }

  function guardar() {
    if (!borrador) return;
    if (borrador.blob.size > MAX_BYTES) {
      setError('El audio pesa más de 16 MB. Probá con uno más corto.');
      return;
    }
    setError(undefined);
    const { blob, nombre, url } = borrador;
    const mime = blob.type.split(';')[0];
    iniciar(async () => {
      const pedido = await pedirSubidaAudio(mime);
      if (!pedido.ok) {
        setError(pedido.error);
        return;
      }
      const subida = await supabaseNavegador()
        .storage.from(BUCKET)
        .uploadToSignedUrl(pedido.path, pedido.token, blob, { contentType: mime });
      if (subida.error) {
        setError('No se pudo subir el audio. Revisá tu conexión y probá de nuevo.');
        return;
      }
      const r = await guardarAudio({ path: pedido.path, mime, nombre });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setActual({ nombre, url: r.url ?? url });
      setBorrador(null);
      avisar('ok', 'Audio guardado. Desde ahora el bot lo manda después del saludo.');
    });
  }

  function sacar() {
    const previo = actual;
    setConfirmar(false);
    setActual(null);
    iniciar(async () => {
      const r = await sacarAudio();
      if (r.ok) return;
      setActual(previo);
      avisar('error', r.error);
    });
  }

  return (
    <section className="placa rounded-2xl p-4">
      <h2 className="text-3xl font-bold">Audio de bienvenida</h2>
      <p className="mt-1 text-tinta-2">El bot lo manda después del primer mensaje.</p>

      {actual ? (
        <div className="mt-3 rounded-xl border border-linea bg-alta/50 p-3">
          <p className="mb-2 font-semibold">{actual.nombre ?? 'Audio actual'}</p>
          {actual.url ? (
            <audio controls preload="metadata" src={actual.url} />
          ) : (
            <p className="text-tinta-2">Está guardado, pero no lo pudimos cargar para escucharlo.</p>
          )}
          <Boton variante="fantasma" className="mt-1 -ml-2" onClick={() => setConfirmar(true)}>
            Sacar audio
          </Boton>
        </div>
      ) : (
        <p className="mt-3 rounded-xl bg-brasa-fondo px-3.5 py-2.5">
          Todavía no hay audio: el bot saluda sin audio.
        </p>
      )}

      {grabando ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-peligro/50 bg-peligro-fondo px-3.5 py-2.5">
          <span aria-hidden="true" className="size-3 animate-pulso rounded-full bg-peligro" />
          <span className="flex-1 font-semibold tabular-nums" role="timer">
            Grabando {tiempoGrabado(segundos)}
          </span>
          <Boton variante="secundario" onClick={frenar}>
            <IconoFrenar />
            Terminar
          </Boton>
        </div>
      ) : borrador ? (
        <div className="mt-3 rounded-xl border border-linea bg-alta/50 p-3">
          <p className="mb-2 font-semibold">Escuchalo antes de guardar</p>
          <audio controls src={borrador.url} />
          <div className="mt-2 flex flex-wrap gap-2">
            <Boton onClick={guardar} disabled={subiendo}>
              {subiendo ? 'Subiendo…' : 'Guardar audio'}
            </Boton>
            <Boton variante="secundario" onClick={grabar} disabled={subiendo}>
              Volver a grabar
            </Boton>
            <Boton variante="fantasma" onClick={descartar} disabled={subiendo}>
              Descartar
            </Boton>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <Boton onClick={grabar}>
            <IconoMicrofono />
            Grabar audio
          </Boton>
          <label className={`${claseBoton('secundario')} cursor-pointer has-focus-visible:outline-3 has-focus-visible:outline-brasa-texto`}>
            <IconoSubir />
            Cargar archivo
            <input type="file" accept="audio/*" onChange={alElegir} className="sr-only" />
          </label>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 font-semibold text-peligro">
          {error}
        </p>
      )}

      <Confirmar
        abierto={confirmar}
        titulo="¿Sacar el audio?"
        mensaje="El bot va a seguir saludando, pero sin audio, hasta que cargues otro."
        accion="Sacar audio"
        onConfirmar={sacar}
        onCancelar={() => setConfirmar(false)}
      />
    </section>
  );
}
