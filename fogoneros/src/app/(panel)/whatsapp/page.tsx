import type { Metadata } from 'next';
import { PanelWhatsapp } from '@/components/whatsapp/panel';

export const metadata: Metadata = {
  title: 'WhatsApp',
  description: 'Conectá el WhatsApp de Fogoneros MW para que el bot conteste.',
  alternates: { canonical: '/whatsapp' },
};

export default function PaginaWhatsapp() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-6 md:px-8 md:py-8">
      <h1 className="text-5xl font-bold">WhatsApp</h1>
      <PanelWhatsapp />
    </div>
  );
}
