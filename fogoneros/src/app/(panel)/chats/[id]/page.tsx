import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { Conversacion } from '@/components/chats/conversacion';
import { firmarMedia, leerChat, leerMensajes, leerNotasDelChat, POR_PAGINA_MENSAJES } from '@/lib/queries';

export const metadata: Metadata = {
  title: 'Chat',
  description: 'Una charla de WhatsApp con un cliente de Fogoneros MW.',
  alternates: { canonical: '/chats' },
};

export default async function PaginaChat({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const [chat, mensajes, notas] = await Promise.all([leerChat(id), leerMensajes(id), leerNotasDelChat(id)]);
  if (!chat) notFound();
  const urls = await firmarMedia(mensajes);

  return (
    <Conversacion
      key={chat.id}
      chat={chat}
      mensajes={mensajes}
      urls={urls}
      notas={notas}
      hayAnteriores={mensajes.length === POR_PAGINA_MENSAJES}
    />
  );
}
