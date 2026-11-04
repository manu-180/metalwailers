import { Suspense, type ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Cascaron, MarcoPanel } from '@/components/panel/cascaron';
import { BannerWhatsapp, PanelVivo } from '@/components/panel/vivo';
import { CerrarSesion, PieLateral, SinAcceso } from '@/components/panel/cuenta';
import { EsqueletoPagina } from '@/components/ui/esqueletos';
import { leerConfig } from '@/lib/queries';
import { accesoActual } from '@/lib/sesion';

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <MarcoPanel ruta="">
          <EsqueletoPagina />
        </MarcoPanel>
      }
    >
      <Guardia>{children}</Guardia>
    </Suspense>
  );
}

async function Guardia({ children }: { children: ReactNode }) {
  await connection();
  // En paralelo: si el usuario no es del equipo, la RLS hace fallar leerConfig y se descarta.
  const [acceso, config] = await Promise.all([accesoActual(), leerConfig().catch(() => null)]);
  if (acceso.estado === 'fuera') redirect('/login');
  if (acceso.estado === 'ajeno') {
    return (
      <SinAcceso>
        <CerrarSesion />
      </SinAcceso>
    );
  }
  return (
    <PanelVivo inicial={config ?? (await leerConfig())} nombre={acceso.nombre}>
      <Cascaron banner={<BannerWhatsapp />} pieLateral={<PieLateral nombre={acceso.nombre} />}>
        {children}
      </Cascaron>
    </PanelVivo>
  );
}
