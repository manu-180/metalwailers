import { diaDelGrafico } from '@/components/formato';
import type { Metricas } from '@/lib/tipos';

export function Grafico({ dias }: { dias: Metricas['por_dia'] }) {
  const maximo = Math.max(1, ...dias.map((d) => d.charlas));
  const total = dias.reduce((s, d) => s + d.charlas, 0);

  return (
    <section className="placa rounded-2xl p-4">
      <h2 className="text-3xl font-bold">Charlas por día</h2>
      <p className="text-tinta-2">Las últimas dos semanas</p>

      {total === 0 ? (
        <p className="mt-4 text-tinta-2">Todavía no hubo charlas. Cuando escriba alguien, lo vas a ver acá.</p>
      ) : (
        <>
          <div aria-hidden="true" className="mt-5 grid h-40 grid-cols-14 items-end gap-1">
            {dias.map((d) => {
              const { inicial } = diaDelGrafico(d.dia);
              const hoy = d === dias[dias.length - 1];
              return (
                <div key={d.dia} className="flex h-full min-w-0 flex-col items-center justify-end gap-1">
                  {d.charlas > 0 && <span className="text-sm leading-none tabular-nums">{d.charlas}</span>}
                  <div
                    className={`w-full rounded-t-[3px] ${hoy ? 'bg-brasa' : 'bg-acero/70'}`}
                    style={{ height: `${Math.max(d.charlas > 0 ? 4 : 2, (d.charlas / maximo) * 78)}%` }}
                  />
                  <span className="text-sm leading-none text-tinta-2">{inicial}</span>
                </div>
              );
            })}
          </div>
          <table className="sr-only">
            <caption>Charlas por día en las últimas dos semanas</caption>
            <thead>
              <tr>
                <th scope="col">Día</th>
                <th scope="col">Charlas</th>
              </tr>
            </thead>
            <tbody>
              {dias.map((d) => (
                <tr key={d.dia}>
                  <th scope="row">{diaDelGrafico(d.dia).completo}</th>
                  <td>{d.charlas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
