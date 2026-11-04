import { Suspense, type ReactNode } from 'react';
import { MarcoChats } from '@/components/chats/marco';
import { ListaChats } from '@/components/chats/lista';
import { Cascaron } from '@/components/panel/cascaron';
import { BannerWhatsapp, PanelVivo } from '@/components/panel/vivo';
import { PieLateral } from '@/components/panel/cuenta';
import { chats, config } from '../datos';

export default function L({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <PanelVivo inicial={{ ...config, wa_estado: 'conectado' }} nombre="Claudia">
        <Cascaron banner={<BannerWhatsapp />} pieLateral={<PieLateral nombre="Claudia" />}>
          <MarcoChats lista={<ListaChats todos={chats} atencion={chats.filter((c) => c.atencion)} porPagina={50} />}>{children}</MarcoChats>
        </Cascaron>
      </PanelVivo>
    </Suspense>
  );
}
