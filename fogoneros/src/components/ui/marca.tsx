export function Marca({ tam = 34 }: { tam?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={tam} height={tam} viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="#27231f" />
        <path d="M12 24h40" stroke="#93a0ab" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M20 16v8M32 16v8M44 16v8" stroke="#93a0ab" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M14 31h36a18 18 0 0 1-36 0Z" fill="#f2792b" />
        <path d="M26 49v6M38 49v6" stroke="#93a0ab" strokeWidth="4.5" strokeLinecap="round" />
      </svg>
      <span className="font-titulo text-2xl leading-none font-extrabold tracking-wide">Fogoneros MW</span>
    </span>
  );
}
