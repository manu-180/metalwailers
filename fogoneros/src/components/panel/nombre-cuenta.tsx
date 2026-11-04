'use client';

import { usePanel } from './vivo';

export function NombreCuenta() {
  const { nombre } = usePanel();
  return (
    <p>
      Entraste como <span className="font-semibold">{nombre}</span>.
    </p>
  );
}
