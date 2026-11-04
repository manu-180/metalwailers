'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { consultarQr, generarQr, quitarVinculo, revisarEstado } from '@/app/(panel)/whatsapp/acciones';
import { telefonoLindo } from '@/components/formato';
import { usePanel } from '@/components/panel/vivo';
import { useAviso } from '@/components/ui/avisos';
import { Boton } from '@/components/ui/boton';
import { Confirmar } from '@/components/ui/dialogo';
import { IconoTilde } from '@/components/ui/iconos';

const CADA_MS = 3000;
const FALLOS_TOLERADOS = 3;

export function PanelWhatsapp() {
  const { config, parcharConfig } = usePanel();
  const avisar = useAviso();
  const [qr, setQr] = useState<string | null>(null);
  const [esperandoQr, setEsperandoQr] = useState(false);
  const [error, setError] = useState<string>();
  const [confirmar, setConfirmar] = useState(false);
  const [generando, iniciar] = useTransition();
  const fallos = useRef(0);

  const conectado = config.wa_estado === 'conectado';
  const mostrandoQr = esperandoQr && !conectado;

  useEffect(() => {
    revisarEstado().then((r) => {
      if (r.ok) parcharConfig({ wa_estado: r.estado, wa_numero: r.numero });
    });
  }, [parcharConfig]);

  // El estado de la vinculación lo tiene el servidor de WhatsApp y no pasa por la base,
  // así que mientras se muestra el QR se consulta; el código además vence y hay que renovarlo.
  useEffect(() => {
    if (!mostrandoQr) return;
    let vivo = true;
    let espera: ReturnType<typeof setTimeout>;

    async function consultar() {
      const r = await consultarQr();
      if (!vivo) return;
      if (r.ok) {
        fallos.current = 0;
        if (r.qr) setQr(r.qr);
        if (r.estado === 'conectado') {
          parcharConfig({ wa_estado: 'conectado', wa_numero: r.numero });
          setEsperandoQr(false);
          setQr(null);
          return;
        }
      } else if (++fallos.current >= FALLOS_TOLERADOS) {
        setEsperandoQr(false);
        setQr(null);
        setError(r.error);
        return;
      }
      espera = setTimeout(consultar, CADA_MS);
    }

    espera = setTimeout(consultar, CADA_MS);
    return () => {
      vivo = false;
      clearTimeout(espera);
    };
  }, [mostrandoQr, parcharConfig]);

  function generar() {
    setError(undefined);
    fallos.current = 0;
    iniciar(async () => {
      const r = await generarQr();
      if (!r.ok) {
        setError(r.error);
        return;
      }
      if (r.estado === 'conectado') {
        parcharConfig({ wa_estado: 'conectado', wa_numero: r.numero });
        return;
      }
      setQr(r.qr);
      setEsperandoQr(true);
    });
  }

  function desvincular() {
    setConfirmar(false);
    const previo = { wa_estado: config.wa_estado, wa_numero: config.wa_numero };
    parcharConfig({ wa_estado: 'sin_vincular', wa_numero: null });
    iniciar(async () => {
      const r = await quitarVinculo();
      if (r.ok) return;
      parcharConfig(previo);
      avisar('error', r.error);
    });
  }

  if (conectado) {
    return (
      <section className="placa rounded-2xl p-5">
        <p className="flex items-center gap-2 text-xl font-semibold">
          <IconoTilde className="shrink-0 text-exito" />
          El bot ya está contestando solo
        </p>
        <p className="mt-2 text-tinta-2">Número vinculado</p>
        <p className="font-titulo text-4xl font-bold tabular-nums">{telefonoLindo(config.wa_numero) ?? 'Sin dato'}</p>
        <Boton variante="secundario" className="mt-5" onClick={() => setConfirmar(true)}>
          Desvincular
        </Boton>
        <Confirmar
          abierto={confirmar}
          titulo="¿Desvincular el WhatsApp?"
          mensaje="Nadie va a contestar hasta que lo vuelvas a vincular."
          accion="Desvincular"
          onConfirmar={desvincular}
          onCancelar={() => setConfirmar(false)}
        />
      </section>
    );
  }

  if (mostrandoQr) {
    return (
      <section className="placa flex flex-col gap-4 rounded-2xl p-5">
        <div className="mx-auto w-full max-w-80 rounded-2xl bg-white p-3">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element -- el QR llega como data URL y cambia cada pocos segundos
            <img src={qr} alt="Código QR para vincular WhatsApp" width={320} height={320} className="h-auto w-full" />
          ) : (
            <div className="grid aspect-square place-items-center text-center font-semibold text-sobre-brasa">
              Preparando el código…
            </div>
          )}
        </div>
        <div>
          <h2 className="text-3xl font-bold">Escaneá el código</h2>
          <p className="mt-1">
            En el teléfono de Claudia abrí WhatsApp, entrá a Dispositivos vinculados, tocá Vincular un dispositivo y
            apuntá la cámara a este código.
          </p>
          <p className="mt-2 text-tinta-2" role="status">
            El código se renueva solo. Cuando se conecte, esta pantalla cambia sola.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="placa rounded-2xl p-5">
      {config.wa_estado === 'desconectado' ? (
        <p>El WhatsApp se desconectó. Generá un código nuevo y escanealo desde el teléfono de Claudia.</p>
      ) : (
        <p>Para que el bot conteste, conectá el WhatsApp de Fogoneros con un código QR.</p>
      )}
      {error && (
        <p role="alert" className="mt-3 rounded-xl border border-peligro/40 bg-peligro-fondo px-3.5 py-2.5">
          {error}
        </p>
      )}
      <Boton grande className="mt-4 w-full" onClick={generar} disabled={generando}>
        {generando ? 'Generando…' : error ? 'Reintentar' : 'Generar código QR'}
      </Boton>
    </section>
  );
}
