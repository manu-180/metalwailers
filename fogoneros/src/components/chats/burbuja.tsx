'use client';

import { useState, type MouseEvent } from 'react';
import { horaCorta } from '@/components/formato';
import { IconoDocumento, IconoLapiz } from '@/components/ui/iconos';
import type { MensajeVista } from '@/lib/queries';
import { useEnsenar } from './ensenar';

export type MensajeLocal = MensajeVista & { local?: boolean; fallo?: boolean; reintentado?: boolean };

type Props = {
  mensaje: MensajeLocal;
  url?: string;
  onRenovar: () => boolean;
  onReintentar: () => void;
};

const COLOR = { cliente: 'bg-cliente', bot: 'bg-bot', humano: 'bg-humano' };
const ETIQUETA = { bot: 'Bot', humano: 'Claudia' };

export function Burbuja({ mensaje: m, url, onRenovar, onReintentar }: Props) {
  const { abrir, notasDe } = useEnsenar();
  const propio = m.autor !== 'cliente';
  const respuesta = (m.texto ?? m.transcripcion ?? '').trim();
  const ensenable = m.autor === 'bot' && Boolean(respuesta);
  const cuantas = ensenable ? notasDe(m.id).length : 0;
  const fallo = m.estado === 'error' || m.fallo;

  function alTocar(e: MouseEvent<HTMLDivElement>) {
    if (!ensenable || window.getSelection()?.toString()) return;
    if ((e.target as HTMLElement).closest('audio,video,a,button')) return;
    abrir({ mensajeId: m.id, texto: respuesta });
  }

  return (
    <div className={`flex flex-col ${propio ? 'items-end' : 'items-start'}`}>
      <div
        onClick={alTocar}
        className={`max-w-[min(34rem,88%)] rounded-2xl border px-3.5 py-2.5 transition-colors duration-150 ${COLOR[m.autor]} ${
          propio ? 'rounded-br-md' : 'rounded-bl-md'
        } ${ensenable ? 'cursor-pointer border-transparent hover:border-control' : 'border-transparent'} ${
          fallo ? 'border-peligro!' : ''
        }`}
      >
        {m.autor !== 'cliente' && (
          <p className={`mb-0.5 text-base font-semibold ${m.autor === 'bot' ? 'text-brasa-texto' : 'text-acero'}`}>
            {ETIQUETA[m.autor]}
          </p>
        )}
        <Contenido mensaje={m} url={url} onRenovar={onRenovar} />
        <p className="mt-1 text-right text-base text-tinta-2" suppressHydrationWarning>
          {m.estado === 'enviando' ? 'Enviando…' : horaCorta(m.creado)}
        </p>
      </div>

      {fallo && (
        <p role="alert" className="mt-1 flex flex-wrap items-center justify-end gap-x-2 text-base font-semibold text-peligro">
          No se pudo enviar
          {m.autor === 'humano' && !m.reintentado && (
            <button type="button" onClick={onReintentar} className="min-h-11 rounded-lg px-1 underline underline-offset-4">
              Reintentar
            </button>
          )}
        </p>
      )}

      {ensenable && (
        <button
          type="button"
          onClick={() => abrir({ mensajeId: m.id, texto: respuesta })}
          aria-label={cuantas > 0 ? `Enseñarle al bot, esta respuesta tiene ${cuantas === 1 ? '1 nota' : `${cuantas} notas`}` : 'Enseñarle al bot sobre esta respuesta'}
          className="group flex min-h-11 items-center"
        >
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-base font-semibold transition-colors duration-150 ${
              cuantas > 0
                ? 'border-brasa/60 bg-brasa-fondo text-brasa-texto'
                : 'border-linea text-tinta-2 group-hover:border-control group-hover:text-tinta'
            }`}
          >
            <IconoLapiz tam={15} />
            {cuantas > 0 ? (cuantas === 1 ? '1 nota' : `${cuantas} notas`) : 'Enseñar'}
          </span>
        </button>
      )}
    </div>
  );
}

function Contenido({ mensaje: m, url, onRenovar }: { mensaje: MensajeLocal; url?: string; onRenovar: () => boolean }) {
  const texto = m.texto?.trim();
  return (
    <div className="flex flex-col gap-1.5">
      {m.tipo !== 'texto' && <Medio mensaje={m} url={url} onRenovar={onRenovar} />}
      {texto && <p className="whitespace-pre-wrap">{texto}</p>}
      {m.tipo === 'audio' && m.transcripcion && (
        <p className="border-l-2 border-control pl-2.5 whitespace-pre-wrap text-tinta-2">{m.transcripcion}</p>
      )}
    </div>
  );
}

function Medio({ mensaje: m, url, onRenovar }: { mensaje: MensajeLocal; url?: string; onRenovar: () => boolean }) {
  const [roto, setRoto] = useState(false);

  // La URL firmada dura 15 minutos: si venció se pide otra una vez antes de darla por perdida.
  const alFallar = () => {
    if (!onRenovar()) setRoto(true);
  };

  const nombres = { audio: 'El audio', imagen: 'La foto', video: 'El video', documento: 'El archivo', sticker: 'El sticker' };
  const nombre = nombres[m.tipo as keyof typeof nombres];
  if (!nombre) return <p className="text-tinta-2">Este mensaje no se puede ver acá.</p>;
  if (roto || !url) {
    if (!m.media_path || roto) return <p className="text-tinta-2">{nombre} no se pudo cargar.</p>;
    return <div className="esqueleto h-11 w-56 max-w-full" />;
  }

  if (m.tipo === 'audio') return <audio controls preload="metadata" src={url} onError={alFallar} className="w-64 max-w-full" />;
  if (m.tipo === 'video') {
    return <video controls preload="metadata" playsInline src={url} onError={alFallar} className="max-h-80 rounded-lg" />;
  }
  if (m.tipo === 'documento') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-11 items-center gap-2 rounded-lg font-semibold underline underline-offset-4"
      >
        <IconoDocumento className="shrink-0" />
        {m.media_nombre ?? 'Abrir archivo'}
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" aria-label={m.tipo === 'sticker' ? 'Abrir sticker' : 'Abrir foto'}>
      {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada de 15 minutos: no sirve pasarla por el optimizador */}
      <img
        src={url}
        alt={m.tipo === 'sticker' ? 'Sticker que mandó el cliente' : 'Foto que mandó el cliente'}
        loading="lazy"
        onError={alFallar}
        className={`rounded-lg ${m.tipo === 'sticker' ? 'size-32 object-contain' : 'max-h-80 object-cover'}`}
      />
    </a>
  );
}
