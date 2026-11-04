import type { Metadata } from 'next';
import { PaginaLegal } from '@/components/panel/legal';

export const metadata: Metadata = {
  title: 'Términos',
  description: 'Las condiciones de uso del WhatsApp y del panel de Fogoneros MW.',
  alternates: { canonical: '/terminos' },
  robots: { index: true, follow: true },
};

export default function PaginaTerminos() {
  return (
    <PaginaLegal titulo="Términos">
      <p>Actualizado el 3 de noviembre de 2026.</p>
      <h2>El WhatsApp de Fogoneros MW</h2>
      <p>
        Por este WhatsApp te asesoramos sobre nuestros fogoneros. Parte de las respuestas las escribe un asistente
        automático. Si algo no te cierra, pedí hablar con una persona del equipo.
      </p>
      <h2>Precios y pedidos</h2>
      <p>
        La información que da el asistente es orientativa. Un precio, una entrega o una compra quedan firmes cuando los
        confirma una persona del equipo.
      </p>
      <h2>El panel</h2>
      <p>
        Este panel es una herramienta interna del equipo de Fogoneros MW. Sólo entran las personas habilitadas, y cada una
        cuida su usuario y contraseña.
      </p>
      <h2>Tus datos</h2>
      <p>Lo que guardamos y cómo pedir la baja está explicado en la página de Privacidad.</p>
    </PaginaLegal>
  );
}
