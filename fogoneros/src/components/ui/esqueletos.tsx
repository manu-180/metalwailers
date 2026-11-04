export function EsqueletoPagina() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8" aria-busy="true" aria-label="Cargando">
      <div className="esqueleto h-10 w-48" />
      <div className="esqueleto mt-3 h-5 w-72 max-w-full" />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="esqueleto h-40" />
        <div className="esqueleto h-40" />
        <div className="esqueleto h-40" />
        <div className="esqueleto h-40" />
      </div>
    </div>
  );
}

export function EsqueletoInicio() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8" aria-busy="true" aria-label="Cargando">
      <div className="esqueleto h-10 w-32" />
      <div className="esqueleto mt-6 h-32" />
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="esqueleto h-36" />
        <div className="esqueleto h-36" />
        <div className="esqueleto h-36" />
        <div className="esqueleto h-36" />
      </div>
      <div className="esqueleto mt-4 h-56" />
    </div>
  );
}

export function EsqueletoLista() {
  return (
    <ul className="flex flex-col gap-1 p-2" aria-busy="true" aria-label="Cargando chats">
      {Array.from({ length: 8 }, (_, i) => (
        <li key={i} className="flex flex-col gap-2 rounded-xl px-3 py-3">
          <div className="flex justify-between gap-6">
            <div className="esqueleto h-5 w-40" />
            <div className="esqueleto h-5 w-12" />
          </div>
          <div className="esqueleto h-4 w-full" />
          <div className="esqueleto h-4 w-2/3" />
        </li>
      ))}
    </ul>
  );
}

export function EsqueletoConversacion() {
  return (
    <div className="flex h-full flex-col" aria-busy="true" aria-label="Cargando la charla">
      <div className="border-b border-linea bg-placa/70 px-4 py-3">
        <div className="esqueleto h-6 w-44" />
        <div className="esqueleto mt-2 h-4 w-32" />
      </div>
      <div className="flex flex-1 flex-col justify-end gap-3 overflow-hidden p-4">
        <div className="esqueleto h-16 w-3/5" />
        <div className="esqueleto ml-auto h-24 w-3/5" />
        <div className="esqueleto h-12 w-2/5" />
        <div className="esqueleto ml-auto h-20 w-1/2" />
      </div>
      <div className="border-t border-linea p-3">
        <div className="esqueleto h-12" />
      </div>
    </div>
  );
}
