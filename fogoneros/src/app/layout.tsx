import type { Metadata, Viewport } from 'next';
import { Atkinson_Hyperlegible_Next, Big_Shoulders } from 'next/font/google';
import type { ReactNode } from 'react';
import { ProveedorAvisos } from '@/components/ui/avisos';
import './globals.css';

const texto = Atkinson_Hyperlegible_Next({
  variable: '--fuente-texto',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

const titulo = Big_Shoulders({
  variable: '--fuente-titulo',
  subsets: ['latin', 'latin-ext'],
  weight: ['600', '700', '800'],
  display: 'swap',
});

const DESCRIPCION = 'Panel de Fogoneros MW para ver las charlas de WhatsApp y enseñarle al bot.';

export const metadata: Metadata = {
  metadataBase: new URL('https://app.metalwailers.com'),
  title: { default: 'Fogoneros MW', template: '%s · Fogoneros MW' },
  description: DESCRIPCION,
  applicationName: 'Fogoneros MW',
  robots: { index: false, follow: false },
  openGraph: {
    type: 'website',
    siteName: 'Fogoneros MW',
    title: 'Fogoneros MW',
    description: DESCRIPCION,
    locale: 'es_AR',
  },
};

export const viewport: Viewport = {
  themeColor: '#131110',
  colorScheme: 'dark',
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${texto.variable} ${titulo.variable}`}>
      <body className="antialiased">
        <ProveedorAvisos>{children}</ProveedorAvisos>
      </body>
    </html>
  );
}
