import { useState } from "react";
import { cn, formatarMoeda, formatarMoedaCompacta } from "@/lib/utils";

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

export type Situacao = "pago" | "emAberto" | "atrasado";

export type ResumoMes = {
  mes: string;
  rotulo: string;
  rotuloLongo: string;
  atual: boolean;
  valores: Record<Situacao, number>;
  quantidades: Record<Situacao, number>;
};

export const SERIES: { chave: Situacao; label: string; cor: string }[] = [
  { chave: "pago", label: "Pago", cor: "bg-grafico-pago" },
  { chave: "emAberto", label: "Em aberto", cor: "bg-grafico-aberto" },
  { chave: "atrasado", label: "Atrasado", cor: "bg-grafico-atrasado" },
];

export const totalDoMes = (m: ResumoMes) => m.valores.pago + m.valores.emAberto + m.valores.atrasado;

const boletos = (n: number) => `${n} ${n === 1 ? "boleto" : "boletos"}`;

function descrever(m: ResumoMes) {
  const partes = SERIES.map((s) => `${s.label}: ${formatarMoeda(m.valores[s.chave])} (${boletos(m.quantidades[s.chave])})`);
  return `${m.rotuloLongo}. Total ${formatarMoeda(totalDoMes(m))}. ${partes.join("; ")}.`;
}

export function LegendaSituacao() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Legenda">
      {SERIES.map((s) => (
        <li key={s.chave} className="flex items-center gap-2 text-xs font-semibold text-ink-600">
          <span aria-hidden className={cn("size-2.5 rounded-[3px]", s.cor)} />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

const ALTURA_GRAFICO_REM = 13;
const ALTURA_TOOLTIP_REM = 8;
const ESPACO_ROTULO_REM = 1.75;

export function BarrasEmpilhadas({ meses }: { meses: ResumoMes[] }) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const maximo = Math.max(...meses.map(totalDoMes), 1);

  return (
    <div>
      <ul className="grid h-52 grid-cols-6 gap-2 border-b border-border sm:gap-4">
        {meses.map((m, i) => {
          const total = totalDoMes(m);
          const visiveis = SERIES.filter((s) => m.valores[s.chave] > 0);
          const topo = visiveis.at(-1)?.chave;
          const destacado = ativo === i;
          const altura = (total / maximo) * 85;
          const cabeAcima = ALTURA_GRAFICO_REM * (1 - altura / 100) - ESPACO_ROTULO_REM >= ALTURA_TOOLTIP_REM;

          const caixa = (
            <div className="rounded-md border bg-popover p-3 text-xs text-popover-foreground shadow-md">
              <p className="font-semibold text-ink-600 first-letter:uppercase">{m.rotuloLongo}</p>
              <p className="mt-0.5 font-mono text-sm font-bold tabular-nums">{formatarMoeda(total)}</p>
              <ul className="mt-2 space-y-1">
                {SERIES.map((s) => (
                  <li key={s.chave} className="flex items-center gap-2 whitespace-nowrap">
                    <span className={cn("h-0.5 w-3 shrink-0 rounded-full", s.cor)} />
                    <span className="font-mono font-semibold tabular-nums">{formatarMoeda(m.valores[s.chave])}</span>
                    <span className="text-ink-600">
                      {s.label}
                      <span className="hidden sm:inline"> · {boletos(m.quantidades[s.chave])}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );

          return (
            <li
              key={m.mes}
              tabIndex={0}
              role="img"
              aria-label={descrever(m)}
              onPointerEnter={() => setAtivo(i)}
              onPointerLeave={() => setAtivo((atual) => (atual === i ? null : atual))}
              onFocus={() => setAtivo(i)}
              onBlur={() => setAtivo((atual) => (atual === i ? null : atual))}
              className="relative h-full rounded-t-md outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <div
                className="absolute bottom-0 left-1/2 flex w-full max-w-6 -translate-x-1/2 flex-col-reverse gap-[2px]"
                style={{ height: `${altura}%` }}
              >
                {total > 0 && (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[11px] font-semibold whitespace-nowrap text-ink-600 tabular-nums">
                    {formatarMoedaCompacta(total)}
                  </span>
                )}
                {visiveis.map((s) => (
                  <div
                    key={s.chave}
                    className={cn("min-h-0 transition-[filter]", s.cor, s.chave === topo && "rounded-t-[4px]", destacado && "brightness-110")}
                    style={{ flex: `${m.valores[s.chave]} 1 0%` }}
                  />
                ))}
              </div>

              {destacado && total > 0 && cabeAcima && (
                <div
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute z-10 w-max",
                    i === 0 ? "left-0" : i === meses.length - 1 ? "right-0" : "left-1/2 -translate-x-1/2",
                  )}
                  style={{ bottom: `calc(${altura}% + ${ESPACO_ROTULO_REM}rem)` }}
                >
                  {caixa}
                </div>
              )}

              {destacado && total > 0 && !cabeAcima && (
                <div
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute inset-y-0 z-10 flex w-max flex-col",
                    i < meses.length / 2 ? "left-[calc(50%+1.25rem)]" : "right-[calc(50%+1.25rem)]",
                  )}
                >
                  <div className="min-h-0 shrink" style={{ flexBasis: `${100 - altura}%` }} />
                  <div className="shrink-0">{caixa}</div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <ul aria-hidden className="mt-2 grid grid-cols-6 gap-2 sm:gap-4">
        {meses.map((m) => (
          <li key={m.mes} className={cn("text-center text-xs capitalize", m.atual ? "font-semibold text-foreground" : "text-ink-600")}>
            {m.rotulo}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TabelaMensal({ meses }: { meses: ResumoMes[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-[13px] text-ink-600">
          <tr className="border-b">
            <th scope="col" className="py-2 pr-4 font-semibold">Mês</th>
            {SERIES.map((s) => (
              <th key={s.chave} scope="col" className="py-2 pr-4 text-right font-semibold">{s.label}</th>
            ))}
            <th scope="col" className="py-2 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody className="font-mono tabular-nums">
          {meses.map((m) => (
            <tr key={m.mes} className={cn("border-b last:border-0", m.atual && "font-semibold")}>
              <th scope="row" className="py-2 pr-4 font-sans font-medium first-letter:uppercase">{m.rotuloLongo}</th>
              {SERIES.map((s) => (
                <td key={s.chave} className="py-2 pr-4 text-right">{formatarMoeda(m.valores[s.chave])}</td>
              ))}
              <td className="py-2 text-right">{formatarMoeda(totalDoMes(m))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
