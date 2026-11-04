import type { ButtonHTMLAttributes } from 'react';

export type Variante = 'primario' | 'secundario' | 'fantasma' | 'peligro';

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-brasa text-sobre-brasa hover:bg-brasa-viva',
  secundario: 'border border-control bg-alta text-tinta hover:bg-linea',
  fantasma: 'text-tinta-2 hover:bg-alta hover:text-tinta',
  peligro: 'bg-peligro-boton text-tinta hover:bg-[#a33328]',
};

export function claseBoton(variante: Variante = 'primario', grande = false) {
  return `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-[background-color,color,transform,opacity] duration-150 ease-salida active:scale-[0.98] disabled:opacity-55 disabled:active:scale-100 ${
    grande ? 'min-h-14 px-6 text-lg' : 'min-h-11 px-4'
  } ${VARIANTES[variante]}`;
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; grande?: boolean };

export function Boton({ variante = 'primario', grande = false, className = '', type = 'button', ...resto }: Props) {
  return <button type={type} className={`${claseBoton(variante, grande)} ${className}`} {...resto} />;
}
