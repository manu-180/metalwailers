'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { cambiarBotGeneral } from '@/app/(panel)/acciones';
import { usePanel } from '@/components/panel/vivo';
import { telefonoLindo } from '@/components/formato';
import { useAviso } from '@/components/ui/avisos';
import { Interruptor } from '@/components/ui/interruptor';

export function InterruptorGeneral() {
  const { config, parcharConfig } = usePanel();
  const avisar = useAviso();
  const [, iniciar] = useTransition();
  const conectado = config.wa_estado === 'conectado';

  function cambiar(activo: boolean) {
    parcharConfig({ bot_activo: activo });
    iniciar(async () => {
      const r = await cambiarBotGeneral(activo);
      if (r.ok) return;
      parcharConfig({ bot_activo: !activo });
      avisar('error', r.error);
    });
  }

  return (
    <section aria-label="Estado del bot" className="placa grid gap-4 rounded-2xl p-4 md:grid-cols-2">
      <Interruptor
        activo={config.bot_activo}
        onCambio={cambiar}
        etiqueta={config.bot_activo ? 'Bot prendido' : 'Bot apagado'}
        ayuda={config.bot_activo ? 'Contesta solo en todos los chats.' : 'No contesta en ningún chat.'}
      />
      <Link href="/whatsapp" className="flex min-h-11 items-center gap-3 rounded-lg">
        <span
          aria-hidden="true"
          className={`size-3 shrink-0 rounded-full ${conectado ? 'bg-exito' : 'bg-peligro'}`}
        />
        <span>
          <span className="block font-semibold">{conectado ? 'WhatsApp conectado' : 'WhatsApp sin conectar'}</span>
          <span className="block text-base text-tinta-2">
            {conectado ? (telefonoLindo(config.wa_numero) ?? 'Funcionando') : 'Tocá acá para conectarlo'}
          </span>
        </span>
      </Link>
    </section>
  );
}
