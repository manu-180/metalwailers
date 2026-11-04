import { Suspense } from 'react';
import { Cascaron } from '@/components/panel/cascaron';
import { BannerWhatsapp, PanelVivo } from '@/components/panel/vivo';
import { PieLateral } from '@/components/panel/cuenta';
import { MarcoChats } from '@/components/chats/marco';
import { ListaChats } from '@/components/chats/lista';
import { Conversacion } from '@/components/chats/conversacion';
import { Grafico } from '@/components/inicio/grafico';
import { InterruptorGeneral } from '@/components/inicio/interruptor-general';
import { ParaClaudia } from '@/components/inicio/para-claudia';
import { LoQueSabe } from '@/components/contexto/lo-que-sabe';
import { Saludo } from '@/components/contexto/saludo';
import { AudioBienvenida } from '@/components/contexto/audio';
import { Notas } from '@/components/contexto/notas';
import { PanelWhatsapp } from '@/components/whatsapp/panel';

const t = (h: number) => new Date(Date.now() - h * 3600e3).toISOString();
const chat = (id: string, nombre: string | null, prev: string, h: number, o = {}) => ({ id, telefono: '5491134272488', nombre, bot_activo: true, atencion: false, atencion_motivo: null, no_leidos: 0, ultimo_at: t(h), ultimo_preview: prev, ultimo_autor: 'cliente' as const, ...o });
const chats = [
  chat('a', 'Marcela Gutierrez', 'Hola quería saber si hacen envíos a zona norte y cuánto sale el fogonero grande con parrilla doble', 0.2, { no_leidos: 2, atencion: true, atencion_motivo: 'Pide coordinar un envío a zona norte' }),
  chat('b', null, 'Audio', 3, { ultimo_autor: 'bot' }),
  chat('c', 'Jorge', 'Dale gracias', 30),
  chat('d', 'Hernán Rodríguez Peña', 'Lo paso a buscar el sábado', 200, { ultimo_autor: 'humano' }),
];
const m = (id: string, autor: 'cliente' | 'bot' | 'humano', texto: string | null, h: number, o = {}) => ({ id, chat_id: 'a', autor, tipo: 'texto' as const, texto, transcripcion: null, media_path: null, media_mime: null, media_nombre: null, estado: 'ok' as const, creado: t(h), ...o });
const mensajes = [
  m('1', 'cliente', 'Hola! vi la publicidad de Instagram', 27),
  m('2', 'bot', 'Hola Marcela, como estas? Gracias por comunicarte con Fogoneros MW. Te mando un audio cortito con lo importante.', 26.9),
  m('3', 'bot', null, 26.8, { tipo: 'audio', media_path: 'x' }),
  m('4', 'cliente', null, 1, { tipo: 'audio', media_path: 'y', transcripcion: 'Quería saber si hacen envíos a zona norte y cuánto sale el grande' }),
  m('5', 'bot', 'Los envíos a zona norte los coordina Claudia. Te paso con ella así te confirma el costo.', 0.9),
  m('6', 'humano', 'Hola Marcela! Te lo llevo el jueves.', 0.5),
  m('7', 'humano', 'Te paso el link de pago', 0.4, { estado: 'error' }),
];
const config = { id: 1, bot_activo: true, saludo: 'Hola {nombre}, como estas?', audio_path: null, audio_mime: null, audio_nombre: null, wa_estado: 'sin_vincular' as const, wa_numero: null };
const contexto = [
  { id: '1', titulo: 'Qué son nuestros fogoneros', contenido: 'Están hechos íntegramente con chapa de 3,2 milímetros. Pintura de alta temperatura, hasta 650 grados.', orden: 10, activo: true },
  { id: '2', titulo: 'Cómo vendemos', contenido: 'Los clientes llegan por la publicidad de Instagram.', orden: 20, activo: true },
  { id: '3', titulo: 'Modelos, medidas y precios', contenido: '', orden: 30, activo: false },
  { id: '4', titulo: 'Formas de pago', contenido: '', orden: 40, activo: false },
];
const notas = [{ id: 'n', mensaje_id: '5', chat_id: 'a', respuesta: 'Los envíos a zona norte los coordina Claudia.', por_que: 'Sonó cortante, primero tiene que preguntar la localidad', como: 'Decime en qué localidad estás y te paso con Claudia', activa: true, autor: 'Santi', creado: t(3) }];
const dias = Array.from({ length: 14 }, (_, i) => ({ dia: new Date(Date.now() - (13 - i) * 864e5).toISOString().slice(0, 10), charlas: [2, 5, 3, 8, 0, 4, 6, 9, 12, 7, 3, 5, 14, 6][i], respuestas: 3 }));

export default async function Previa({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  return <Suspense><Vista searchParams={searchParams} /></Suspense>;
}

async function Vista({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  const { v = 'inicio' } = await searchParams;
  return (
    <PanelVivo inicial={config} nombre="Claudia">
      <Cascaron banner={<BannerWhatsapp />} pieLateral={<PieLateral nombre="Claudia" />}>
        {v === 'inicio' && (
          <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 md:px-8 md:py-8">
            <h1 className="text-5xl font-bold">Inicio</h1>
            <ParaClaudia inicial={chats.filter((c) => c.atencion)} />
            <InterruptorGeneral />
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[['Charlas hoy', 6], ['Charlas esta semana', 42], ['Respuestas del bot esta semana', 318], ['Contactos guardados', 127]].map(([a, b]) => (
                <div key={a} className="placa flex flex-col justify-between gap-3 rounded-2xl p-4"><p className="text-tinta-2">{a}</p><p className="font-titulo text-6xl leading-none font-bold tabular-nums">{b}</p></div>
              ))}
            </section>
            <Grafico dias={dias} />
          </div>
        )}
        {v === 'lista' && <MarcoChats lista={<ListaChats todos={chats} atencion={chats.filter((c) => c.atencion)} porPagina={50} />}><div /></MarcoChats>}
        {v === 'chat' && <div className="flex h-full"><div className="hidden w-96 shrink-0 overflow-y-auto border-r border-linea lg:block"><MarcoChats lista={<ListaChats todos={chats} atencion={[]} porPagina={50} />}><div /></MarcoChats></div><div className="min-w-0 flex-1"><MarcoChats lista={null}><Conversacion chat={chats[0]} mensajes={mensajes} urls={{}} notas={notas} hayAnteriores /></MarcoChats></div></div>}
        {v === 'contexto' && <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6"><h1 className="text-5xl font-bold">Contexto</h1><LoQueSabe inicial={contexto} /><Saludo inicial={config.saludo} /><AudioBienvenida inicial={null} /><Notas inicial={notas} /></div>}
        {v === 'whatsapp' && <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-6"><h1 className="text-5xl font-bold">WhatsApp</h1><PanelWhatsapp /></div>}
      </Cascaron>
    </PanelVivo>
  );
}
