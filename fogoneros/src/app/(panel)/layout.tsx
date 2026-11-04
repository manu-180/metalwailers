import { Suspense, type ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { Cascaron } from '@/components/panel/cascaron';
import { BannerWhatsapp, PanelVivo } from '@/components/panel/vivo';
import { CerrarSesion, PieLateral, SinAcceso } from '@/components/panel/cuenta';
import { EsqueletoPagina } from '@/components/ui/esqueletos';
import { leerConfig } from '@/lib/queries';
import { accesoActual } from '@/lib/sesion';

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <Cascaron>
          <EsqueletoPagina />
        </Cascaron>
      }
    >
      <Guardia>{children}</Guardia>
    </Suspense>
  );
}

async function Guardia({ children }: { children: ReactNode }) {
  const acceso = await accesoActual();
  if (acceso.estado === 'fuera') redirect('/login');
  if (acceso.estado === 'ajeno') {
    return (
      <SinAcceso>
        <CerrarSesion />
      </SinAcceso>
    );
  }
  const config = await leerConfig();
  return (
    <PanelVivo inicial={config} nombre={acceso.nombre}>
      <Cascaron banner={<BannerWhatsapp />} pieLateral={<PieLateral nombre={acceso.nombre} />}>
        {children}
      </Cascaron>
    </PanelVivo>
  );
}
