import type { Metadata } from 'next';
import { AudioBienvenida } from '@/components/contexto/audio';
import { LoQueSabe } from '@/components/contexto/lo-que-sabe';
import { Notas } from '@/components/contexto/notas';
import { Saludo } from '@/components/contexto/saludo';
import { firmarRutas, leerConfig, leerContexto, leerNotasActivas } from '@/lib/queries';

export const metadata: Metadata = {
  title: 'Contexto',
  description: 'Lo que sabe el bot de Fogoneros MW: saludo, audio, datos del producto y lo que le fueron enseñando.',
  alternates: { canonical: '/contexto' },
};

export default async function PaginaContexto() {
  const [config, entradas, notas] = await Promise.all([leerConfig(), leerContexto(), leerNotasActivas()]);
  const urls = await firmarRutas([config.audio_path]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6 md:px-8 md:py-8">
      <header>
        <h1 className="text-5xl font-bold">Contexto</h1>
        <p className="mt-1 text-tinta-2">Lo que cargues acá el bot lo usa desde la próxima respuesta.</p>
      </header>
      <LoQueSabe inicial={entradas} />
      <Saludo inicial={config.saludo} />
      <AudioBienvenida
        inicial={config.audio_path ? { nombre: config.audio_nombre, url: urls[config.audio_path] ?? null } : null}
      />
      <Notas inicial={notas} />
    </div>
  );
}
