'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ConfigVista } from '@/lib/queries';
import { IconoAtencion } from '@/components/ui/iconos';
import { claseBoton } from '@/components/ui/boton';
import { useCanal } from '@/components/ui/tiempo-real';

type Ctx = {
  config: ConfigVista;
  parcharConfig: (p: Partial<ConfigVista>) => void;
  nombre: string;
};

const CtxPanel = createContext<Ctx | null>(null);

export function usePanel() {
  const ctx = useContext(CtxPanel);
  if (!ctx) throw new Error('usePanel fuera del panel');
  return ctx;
}

export function PanelVivo({ inicial, nombre, children }: { inicial: ConfigVista; nombre: string; children: ReactNode }) {
  const [config, setConfig] = useState(inicial);
  const router = useRouter();

  const parcharConfig = useCallback((p: Partial<ConfigVista>) => setConfig((c) => ({ ...c, ...p })), []);

  useCanal(
    'fg-config',
    (canal) =>
      canal.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'fg_config' },
        (cambio) => setConfig((c) => ({ ...c, ...(cambio.new as Partial<ConfigVista>) })),
      ),
    () => router.refresh(),
  );

  const valor = useMemo(() => ({ config, parcharConfig, nombre }), [config, parcharConfig, nombre]);
  return <CtxPanel.Provider value={valor}>{children}</CtxPanel.Provider>;
}

export function BannerWhatsapp() {
  const { config } = usePanel();
  const ruta = usePathname();
  if (config.wa_estado === 'conectado') return null;
  return (
    <div role="alert" className="border-b border-peligro/40 bg-peligro-fondo px-4 py-2.5">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2">
        <p className="flex min-w-0 flex-1 basis-56 items-start gap-2 font-semibold">
          <IconoAtencion className="mt-0.5 shrink-0 text-peligro" />
          El WhatsApp no está conectado y nadie está contestando
        </p>
        {ruta !== '/whatsapp' && (
          <Link href="/whatsapp" className={claseBoton('secundario')}>
            Conectar WhatsApp
          </Link>
        )}
      </div>
    </div>
  );
}
