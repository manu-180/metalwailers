import { Suspense, type ReactNode } from 'react';
import { ListaChats } from '@/components/chats/lista';
import { MarcoChats } from '@/components/chats/marco';
import { EsqueletoLista } from '@/components/ui/esqueletos';
import { leerChats, POR_PAGINA_CHATS } from '@/lib/queries';

export default function ChatsLayout({ children }: { children: ReactNode }) {
  return (
    <MarcoChats
      lista={
        <Suspense fallback={<EsqueletoLista />}>
          <Lista />
        </Suspense>
      }
    >
      {children}
    </MarcoChats>
  );
}

async function Lista() {
  const [todos, atencion] = await Promise.all([leerChats(), leerChats(null, true)]);
  return <ListaChats todos={todos} atencion={atencion} porPagina={POR_PAGINA_CHATS} />;
}
