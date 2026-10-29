import { cn, formatarMoeda } from "@/lib/utils";

export function Sparkline({ valores, className }: { valores: number[]; className?: string }) {
  const maximo = Math.max(...valores, 1);
  const pontos = valores
    .map((v, i) => `${(i / (valores.length - 1)) * 100},${30 - (v / maximo) * 28}`)
    .join(" ");

  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden className={cn("h-8 w-20", className)}>
      <polyline
        points={pontos}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function BarrasMensais({ meses }: { meses: { rotulo: string; valor: number; atual: boolean }[] }) {
  const maximo = Math.max(...meses.map((m) => m.valor), 1);

  return (
    <ul className="grid h-52 grid-cols-6 items-end gap-3 sm:gap-5">
      {meses.map((m) => {
        const altura = (m.valor / maximo) * 100;
        return (
          <li key={m.rotulo} className="flex h-full flex-col items-center gap-1.5" title={formatarMoeda(m.valor)}>
            <span className="font-mono text-[11px] font-semibold text-ink-600 tabular-nums">
              {m.valor ? formatarMoeda(m.valor).replace(/,\d{2}$/, "") : "–"}
            </span>
            <div className="relative w-full max-w-12 flex-1">
              <svg viewBox="0 0 10 100" preserveAspectRatio="none" aria-hidden className="absolute inset-0 size-full">
                <rect
                  x={0}
                  y={100 - altura}
                  width={10}
                  height={altura}
                  className={m.atual ? "fill-brand-500" : "fill-brand-200"}
                />
              </svg>
            </div>
            <span className={cn("text-xs capitalize", m.atual ? "font-semibold text-foreground" : "text-ink-600")}>
              {m.rotulo}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
