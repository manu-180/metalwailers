import type { Metadata } from 'next';
import Link from 'next/link';
import { Marca } from '@/components/ui/marca';
import { FormularioLogin } from './formulario';

export const metadata: Metadata = {
  title: 'Entrar',
  description: 'Entrá al panel de Fogoneros MW para ver las charlas y enseñarle al bot.',
  alternates: { canonical: '/login' },
};

export default function PaginaLogin() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-8">
      <Marca tam={40} />
      <h1 className="mt-8 text-5xl font-bold">Entrá al panel</h1>
      <p className="mt-2 text-tinta-2">Con tu usuario, por ejemplo santi o claudia.</p>
      <div className="placa mt-6 rounded-2xl p-5">
        <FormularioLogin />
      </div>
      <p className="mt-4 text-tinta-2">Si te olvidaste la contraseña avisale a Manu.</p>
      <nav aria-label="Información legal" className="mt-6 flex gap-5 text-tinta-2">
        <Link href="/privacidad" className="inline-flex min-h-11 items-center underline underline-offset-4">
          Privacidad
        </Link>
        <Link href="/terminos" className="inline-flex min-h-11 items-center underline underline-offset-4">
          Términos
        </Link>
      </nav>
    </main>
  );
}
