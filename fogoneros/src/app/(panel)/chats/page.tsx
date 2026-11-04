import type { Metadata } from 'next';
import { IconoChats } from '@/components/ui/iconos';

export const metadata: Metadata = {
  title: 'Chats',
  description: 'Las charlas de WhatsApp de Fogoneros MW, una por cliente.',
  alternates: { canonical: '/chats' },
};

export default function PaginaChats() {
  return (
    <>
      <h1 className="sr-only">Chats</h1>
      <div className="hidden h-full flex-col items-center justify-center gap-2 px-6 text-center text-tinta-2 lg:flex">
        <IconoChats tam={40} className="text-acero" />
        <p>Elegí un chat de la lista para leerlo.</p>
      </div>
    </>
  );
}
