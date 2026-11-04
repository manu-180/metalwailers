import type { Metadata } from 'next';
import { CerrarSesion } from '@/components/panel/cuenta';
import { NombreCuenta } from '@/components/panel/nombre-cuenta';

export const metadata: Metadata = {
  title: 'Mi cuenta',
  description: 'Tu cuenta del panel de Fogoneros MW.',
  alternates: { canonical: '/cuenta' },
};

export default function PaginaCuenta() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6 md:px-8 md:py-8">
      <h1 className="text-5xl font-bold">Mi cuenta</h1>
      <section className="placa rounded-2xl p-5">
        <NombreCuenta />
        <div className="mt-4">
          <CerrarSesion ancho />
        </div>
      </section>
    </div>
  );
}
