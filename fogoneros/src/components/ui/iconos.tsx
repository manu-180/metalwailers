import type { ReactNode, SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement> & { tam?: number };

function Base({ tam = 22, children, ...resto }: Props & { children: ReactNode }) {
  return (
    <svg
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...resto}
    >
      {children}
    </svg>
  );
}

export const IconoInicio = (p: Props) => (
  <Base {...p}>
    <path d="M4 11.2 12 4.5l8 6.7" />
    <path d="M6 9.7V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.7" />
    <path d="M10 20v-5.5h4V20" />
  </Base>
);

export const IconoChats = (p: Props) => (
  <Base {...p}>
    <path d="M20 11.5a7.5 7.5 0 0 1-11 6.6L4.5 19.5l1.4-4.3A7.5 7.5 0 1 1 20 11.5Z" />
    <path d="M9 10.5h6M9 13.5h4" />
  </Base>
);

export const IconoContexto = (p: Props) => (
  <Base {...p}>
    <path d="M6 4h11a1 1 0 0 1 1 1v15H7a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1Z" />
    <path d="M5 18a2 2 0 0 1 2-2h11" />
    <path d="M9 8h5M9 11h3" />
  </Base>
);

export const IconoWhatsapp = (p: Props) => (
  <Base {...p}>
    <rect x="7" y="3" width="10" height="18" rx="2" />
    <path d="M11 18h2" />
  </Base>
);

export const IconoCuenta = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
  </Base>
);

export const IconoCruz = (p: Props) => (
  <Base {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Base>
);

export const IconoVolver = (p: Props) => (
  <Base {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Base>
);

export const IconoFlecha = (p: Props) => (
  <Base {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Base>
);

export const IconoCopiar = (p: Props) => (
  <Base {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
  </Base>
);

export const IconoTilde = (p: Props) => (
  <Base {...p}>
    <path d="M5 12.5 10 17.5 19 7" />
  </Base>
);

export const IconoEnviar = (p: Props) => (
  <Base {...p}>
    <path d="M12 19V6M6 11.5 12 5.5l6 6" />
  </Base>
);

export const IconoLapiz = (p: Props) => (
  <Base {...p}>
    <path d="m5 19 1-4 9.5-9.5a1.8 1.8 0 0 1 2.5 0l.5.5a1.8 1.8 0 0 1 0 2.5L9 18l-4 1Z" />
  </Base>
);

export const IconoMas = (p: Props) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const IconoAtencion = (p: Props) => (
  <Base {...p}>
    <path d="M12 8v5M12 16.5v.01" />
    <path d="M10.3 4.4 3 17.2A2 2 0 0 0 4.7 20h14.6a2 2 0 0 0 1.7-2.8L13.7 4.4a2 2 0 0 0-3.4 0Z" />
  </Base>
);

export const IconoMicrofono = (p: Props) => (
  <Base {...p}>
    <rect x="9" y="3.5" width="6" height="11" rx="3" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5" />
  </Base>
);

export const IconoFrenar = (p: Props) => (
  <Base {...p}>
    <rect x="7" y="7" width="10" height="10" rx="1.5" />
  </Base>
);

export const IconoSubir = (p: Props) => (
  <Base {...p}>
    <path d="M12 15.5V5M7.5 9.5 12 5l4.5 4.5" />
    <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
  </Base>
);

export const IconoDocumento = (p: Props) => (
  <Base {...p}>
    <path d="M7 3.5h7l4.5 4.5V19a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5Z" />
    <path d="M14 3.5V8h4.5" />
  </Base>
);
