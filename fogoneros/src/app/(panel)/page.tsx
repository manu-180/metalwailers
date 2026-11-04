import type { Metadata } from 'next';
import { Grafico } from '@/components/inicio/grafico';
import { InterruptorGeneral } from '@/components/inicio/interruptor-general';
import { ParaClaudia } from '@/components/inicio/para-claudia';
import { leerChats, leerMetricas } from '@/lib/queries';

export const metadata: Metadata = {
  title: 'Inicio',
  description: 'Cómo viene el WhatsApp de Fogoneros MW y quién espera respuesta.',
  alternates: { canonical: '/' },
};

export default async function PaginaInicio() {
  const [metricas, atencion] = await Promise.all([leerMetricas(), leerChats(null, true)]);

  const tarjetas = [
    { titulo: 'Charlas hoy', valor: metricas.charlas_hoy },
    { titulo: 'Charlas esta semana', valor: metricas.charlas_7d },
    { titulo: 'Respuestas del bot esta semana', valor: metricas.respuestas_7d },
    { titulo: 'Contactos guardados', valor: metricas.contactos },
  ];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 md:px-8 md:py-8">
      <h1 className="text-5xl font-bold">Inicio</h1>

      <ParaClaudia inicial={atencion} />

      <InterruptorGeneral />

      <section aria-label="Números de la semana" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tarjetas.map((t) => (
          <div key={t.titulo} className="placa flex flex-col justify-between gap-3 rounded-2xl p-4">
            <p className="text-tinta-2">{t.titulo}</p>
            <p className="font-titulo text-6xl leading-none font-bold tabular-nums">
              {t.valor.toLocaleString('es-AR')}
            </p>
          </div>
        ))}
      </section>

      <Grafico dias={metricas.por_dia} />
    </div>
  );
}
