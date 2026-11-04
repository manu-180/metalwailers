'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition, type FormEvent, type KeyboardEvent } from 'react';
import {
  cambiarBotDelChat,
  enviarMensaje,
  marcarAtendido,
  marcarLeido,
  mensajesDelChat,
  urlsDeMensajes,
} from '@/app/(panel)/chats/acciones';
import { etiquetaDia, mismoDia, nombreDeChat, telefonoLindo } from '@/components/formato';
import { useAviso } from '@/components/ui/avisos';
import { Boton } from '@/components/ui/boton';
import { IconoAtencion, IconoCopiar, IconoEnviar, IconoTilde, IconoVolver } from '@/components/ui/iconos';
import { Interruptor } from '@/components/ui/interruptor';
import { useCanal } from '@/components/ui/tiempo-real';
import type { ChatVista, MensajeVista, NotaVista, UrlsFirmadas } from '@/lib/queries';
import { Burbuja, type MensajeLocal } from './burbuja';
import { ProveedorEnsenar } from './ensenar';
import { useChats } from './marco';

function unir(base: MensajeLocal[], nuevos: MensajeVista[]) {
  const mapa = new Map(base.map((m) => [m.id, m]));
  for (const n of nuevos) {
    // El mensaje que mandó esta pantalla vuelve de la base con su id real: reemplaza al temporal.
    if (n.autor === 'humano') {
      const temporal = [...mapa.values()].find((m) => m.local && m.autor === 'humano' && m.texto === n.texto);
      if (temporal) mapa.delete(temporal.id);
    }
    mapa.set(n.id, { ...mapa.get(n.id), ...n });
  }
  return [...mapa.values()].sort((a, b) => a.creado.localeCompare(b.creado));
}

type Props = {
  chat: ChatVista;
  mensajes: MensajeVista[];
  urls: UrlsFirmadas;
  notas: NotaVista[];
  hayAnteriores: boolean;
};

export function Conversacion({ chat: chatInicial, mensajes, urls: urlsIniciales, notas, hayAnteriores }: Props) {
  const avisar = useAviso();
  const { parchar } = useChats();
  const [chat, setChat] = useState(chatInicial);
  const [lista, setLista] = useState<MensajeLocal[]>(mensajes);
  const [urls, setUrls] = useState(urlsIniciales);
  const [hayMas, setHayMas] = useState(hayAnteriores);
  const [texto, setTexto] = useState('');
  const [cargandoViejos, iniciarViejos] = useTransition();
  const [, iniciar] = useTransition();
  const renovados = useRef(new Set<string>());
  const id = chatInicial.id;

  useEffect(() => {
    if (chatInicial.no_leidos === 0) return;
    parchar(id, { no_leidos: 0 });
    marcarLeido(id);
  }, [chatInicial.no_leidos, id, parchar]);

  async function firmar(ids: string[]) {
    const r = await urlsDeMensajes(ids);
    if (r.ok) setUrls((u) => ({ ...u, ...r.urls }));
  }

  useCanal(
    `fg-chat-${id}`,
    (canal) =>
      canal
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'fg_mensajes', filter: `chat_id=eq.${id}` },
          (cambio) => {
            if (cambio.eventType === 'DELETE') return;
            const fila = cambio.new as MensajeVista;
            setLista((l) => unir(l, [fila]));
            if (fila.media_path) firmar([fila.id]);
            if (cambio.eventType === 'INSERT' && fila.autor === 'cliente' && document.visibilityState === 'visible') {
              parchar(id, { no_leidos: 0 });
              marcarLeido(id);
            }
          },
        )
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'fg_chats', filter: `id=eq.${id}` }, (cambio) =>
          setChat((c) => ({ ...c, ...(cambio.new as ChatVista) })),
        ),
    async () => {
      const r = await mensajesDelChat(id, null);
      if (!r.ok) return;
      setLista((l) => unir(l, r.mensajes));
      setUrls((u) => ({ ...u, ...r.urls }));
    },
  );

  function cambiar(campos: Partial<ChatVista>, accion: () => Promise<{ ok: boolean; error?: string }>) {
    const previo = chat;
    setChat({ ...chat, ...campos });
    parchar(id, campos);
    iniciar(async () => {
      const r = await accion();
      if (r.ok) return;
      setChat(previo);
      parchar(id, previo);
      avisar('error', r.error ?? 'No pudimos guardar el cambio.');
    });
  }

  function mandar(contenido: string) {
    const temporal: MensajeLocal = {
      id: `temp-${crypto.randomUUID()}`,
      chat_id: id,
      autor: 'humano',
      tipo: 'texto',
      texto: contenido,
      transcripcion: null,
      media_path: null,
      media_mime: null,
      media_nombre: null,
      estado: 'enviando',
      creado: new Date().toISOString(),
      local: true,
    };
    setLista((l) => [...l, temporal]);
    setChat((c) => ({ ...c, bot_activo: false, atencion: false, atencion_motivo: null }));
    parchar(id, {
      bot_activo: false,
      atencion: false,
      atencion_motivo: null,
      ultimo_preview: contenido,
      ultimo_autor: 'humano',
      ultimo_at: temporal.creado,
    });
    iniciar(async () => {
      const r = await enviarMensaje(id, contenido);
      setLista((l) =>
        l.map((m) => (m.id === temporal.id ? { ...m, estado: r.ok ? 'ok' : 'error', fallo: !r.ok } : m)),
      );
      if (!r.ok) avisar('error', r.error);
    });
  }

  function reintentar(m: MensajeLocal) {
    setLista((l) => (m.local ? l.filter((x) => x.id !== m.id) : l.map((x) => (x.id === m.id ? { ...x, reintentado: true } : x))));
    if (m.texto) mandar(m.texto);
  }

  function alEnviar(e?: FormEvent) {
    e?.preventDefault();
    const contenido = texto.trim();
    if (!contenido) return;
    setTexto('');
    mandar(contenido);
  }

  function alTeclear(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(pointer: fine)').matches) {
      e.preventDefault();
      alEnviar();
    }
  }

  function cargarAnteriores() {
    const desde = lista.find((m) => !m.local)?.creado;
    if (!desde) return;
    iniciarViejos(async () => {
      const r = await mensajesDelChat(id, desde);
      if (!r.ok) {
        avisar('error', r.error);
        return;
      }
      setLista((l) => unir(l, r.mensajes));
      setUrls((u) => ({ ...u, ...r.urls }));
      setHayMas(r.mensajes.length > 0 && r.mensajes.length % 60 === 0);
    });
  }

  function renovar(m: MensajeVista) {
    if (renovados.current.has(m.id)) return false;
    renovados.current.add(m.id);
    firmar([m.id]);
    return true;
  }

  return (
    <ProveedorEnsenar notasIniciales={notas}>
      <div className="flex h-full flex-col">
        <Encabezado
          chat={chat}
          onBot={(activo) => cambiar({ bot_activo: activo }, () => cambiarBotDelChat(id, activo))}
          onAtendido={() => cambiar({ atencion: false, atencion_motivo: null }, () => marcarAtendido(id))}
        />

        <div className="flex min-h-0 flex-1 flex-col-reverse overflow-y-auto px-3 py-4 md:px-5">
          <div className="mx-auto w-full max-w-3xl">
            {hayMas && (
              <div className="mb-4 text-center">
                <Boton variante="secundario" onClick={cargarAnteriores} disabled={cargandoViejos}>
                  {cargandoViejos ? 'Trayendo…' : 'Ver mensajes anteriores'}
                </Boton>
              </div>
            )}
            {lista.length === 0 ? (
              <p className="py-10 text-center text-tinta-2">Todavía no hay mensajes en este chat.</p>
            ) : (
              <ol className="flex flex-col gap-2.5">
                {lista.map((m, i) => {
                  const previo = lista[i - 1];
                  const nuevoDia = !previo || !mismoDia(previo.creado, m.creado);
                  return (
                    <li key={m.id}>
                      {nuevoDia && (
                        <p suppressHydrationWarning className="py-2 text-center text-base font-semibold text-tinta-2">
                          {etiquetaDia(m.creado)}
                        </p>
                      )}
                      <Burbuja
                        mensaje={m}
                        url={m.media_path ? urls[m.media_path] : undefined}
                        onRenovar={() => renovar(m)}
                        onReintentar={() => reintentar(m)}
                      />
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        <form onSubmit={alEnviar} className="border-t border-linea bg-placa/70 px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <div className="mx-auto max-w-3xl">
            <p className="mb-1.5 text-base text-tinta-2">Si escribís vos, el bot deja de contestar en este chat.</p>
            <div className="flex items-end gap-2">
              <label className="min-w-0 flex-1">
                <span className="sr-only">Escribirle al cliente</span>
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={alTeclear}
                  rows={1}
                  maxLength={4000}
                  placeholder="Escribí un mensaje"
                  className="max-h-40 min-h-12 w-full resize-none rounded-xl border border-control bg-fondo/60 px-3.5 py-2.5 placeholder:text-tinta-3 focus:border-brasa-texto"
                />
              </label>
              <button
                type="submit"
                aria-label="Enviar mensaje"
                disabled={!texto.trim()}
                className="grid size-12 shrink-0 place-items-center rounded-xl bg-brasa text-sobre-brasa transition-[background-color,transform,opacity] duration-150 ease-salida hover:bg-brasa-viva active:scale-95 disabled:opacity-55"
              >
                <IconoEnviar />
              </button>
            </div>
          </div>
        </form>
      </div>
    </ProveedorEnsenar>
  );
}

function Encabezado({
  chat,
  onBot,
  onAtendido,
}: {
  chat: ChatVista;
  onBot: (activo: boolean) => void;
  onAtendido: () => void;
}) {
  const avisar = useAviso();
  const [copiado, setCopiado] = useState(false);
  const telefono = telefonoLindo(chat.telefono);
  const nombre = nombreDeChat(chat);

  async function copiar() {
    if (!chat.telefono) return;
    try {
      await navigator.clipboard.writeText(`+${chat.telefono.replace(/\D/g, '')}`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      avisar('error', 'No pudimos copiar el teléfono.');
    }
  }

  return (
    <header className="border-b border-linea bg-placa/70 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-1 px-2 py-1.5 md:px-4">
        <Link
          href="/chats"
          aria-label="Volver a los chats"
          className="grid size-11 shrink-0 place-items-center rounded-lg text-tinta-2 hover:bg-alta lg:hidden"
        >
          <IconoVolver />
        </Link>
        <div className="min-w-0 flex-1 pl-1">
          <h1 className="text-3xl font-bold">{nombre}</h1>
          {telefono && telefono !== nombre && <p className="text-base text-tinta-2">{telefono}</p>}
        </div>
        {telefono && (
          <button
            type="button"
            onClick={copiar}
            aria-label={copiado ? 'Teléfono copiado' : 'Copiar teléfono'}
            className="grid size-11 shrink-0 place-items-center rounded-lg text-tinta-2 hover:bg-alta"
          >
            {copiado ? <IconoTilde className="text-exito" /> : <IconoCopiar />}
          </button>
        )}
      </div>

      <div className="border-t border-linea/70 px-4 py-1">
        <Interruptor activo={chat.bot_activo} onCambio={onBot} etiqueta="El bot contesta en este chat" />
      </div>

      {chat.atencion && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-brasa/40 bg-brasa-fondo px-4 py-2.5">
          <p className="flex min-w-0 flex-1 basis-52 items-start gap-2">
            <IconoAtencion className="mt-0.5 shrink-0 text-brasa-texto" />
            <span>
              <span className="font-semibold text-brasa-texto">Para Claudia</span>
              {chat.atencion_motivo && <span className="block">{chat.atencion_motivo}</span>}
            </span>
          </p>
          <Boton onClick={onAtendido}>Ya lo atendí</Boton>
        </div>
      )}
    </header>
  );
}
