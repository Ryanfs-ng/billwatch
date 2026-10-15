import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AbasResponsavel, consultaDaAba, useAba } from "@/components/AbasResponsavel";
import { IconButton } from "@/components/IconButton";
import { Modal } from "@/components/Modal";
import { StatusDot } from "@/components/StatusDot";
import { Button } from "@/components/ui/button";
import { cn, formatarMoeda, hojeISO, mensagemErro } from "@/lib/utils";
import type { Boleto } from "@/types";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Cor de cada dia: atrasado ganha de a vencer/pendente, que ganha de pago (Design.md, CalendarDay).
const COR_DIA = {
  atrasado: { chip: "bg-atrasado-bg text-atrasado", dot: "bg-atrasado", label: "Atrasado" },
  aVencer: { chip: "bg-a-vencer-bg text-a-vencer", dot: "bg-a-vencer", label: "A vencer" },
  pago: { chip: "bg-pago-bg text-pago", dot: "bg-pago", label: "Pago" },
};

export function corDoDia(boletos: Boleto[]): keyof typeof COR_DIA {
  if (boletos.some((b) => b.status === "ATRASADO")) return "atrasado";
  if (boletos.some((b) => b.status !== "PAGO")) return "aVencer";
  return "pago";
}

// Células da grade do mês: null é um espaço vazio antes do dia 1 ou depois do último dia.
export function diasDoMes(ano: number, mes: number): (number | null)[] {
  const primeiroDiaDaSemana = new Date(ano, mes, 1).getDay(); // 0 = domingo
  const totalDeDias = new Date(ano, mes + 1, 0).getDate(); // dia 0 do mês seguinte = último dia deste
  const celulas: (number | null)[] = [];
  for (let i = 0; i < primeiroDiaDaSemana; i++) celulas.push(null);
  for (let dia = 1; dia <= totalDeDias; dia++) celulas.push(dia);
  while (celulas.length % 7 !== 0) celulas.push(null);
  return celulas;
}

// (2026, 8, 5) -> "2026-09-05", mesmo formato do dataVencimento que vem da API.
const dataISO = (ano: number, mes: number, dia: number) =>
  `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

const plural = (n: number) => `${n} ${n === 1 ? "vencimento" : "vencimentos"}`;

export function Calendario() {
  const hoje = hojeISO();
  const [ano, setAno] = useState(() => new Date().getFullYear());
  const [mes, setMes] = useState(() => new Date().getMonth()); // 0 = janeiro
  const [diaAberto, setDiaAberto] = useState<string | null>(null);

  const aba = useAba();
  const boletos = useQuery(consultaDaAba(aba));

  // Agrupa os boletos pela data de vencimento: { "2026-09-18": [boleto, boleto], ... }
  const porDia = new Map<string, Boleto[]>();
  for (const boleto of boletos.data ?? []) {
    const lista = porDia.get(boleto.dataVencimento) ?? [];
    lista.push(boleto);
    porDia.set(boleto.dataVencimento, lista);
  }

  function mudarMes(quantidade: number) {
    const novo = new Date(ano, mes + quantidade, 1); // o Date já vira o ano (dezembro + 1 = janeiro)
    setAno(novo.getFullYear());
    setMes(novo.getMonth());
  }

  function irParaHoje() {
    setAno(new Date().getFullYear());
    setMes(new Date().getMonth());
  }

  const nomeDoMes = new Date(ano, mes, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const boletosDoDia = diaAberto ? (porDia.get(diaAberto) ?? []) : [];

  return (
    <>
      <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-[28px]">Calendário</h1>

      <AbasResponsavel />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <IconButton label="Mês anterior" onClick={() => mudarMes(-1)} className="size-10 border">
            <ChevronLeft />
          </IconButton>
          <p className="w-40 text-center font-display text-lg font-extrabold capitalize" aria-live="polite">
            {nomeDoMes.replace(" de ", " ")}
          </p>
          <IconButton label="Próximo mês" onClick={() => mudarMes(1)} className="size-10 border">
            <ChevronRight />
          </IconButton>
          <Button variant="outline" onClick={irParaHoje} className="ml-1">
            Hoje
          </Button>
        </div>

        <ul className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Legenda">
          {Object.values(COR_DIA).map(({ dot, label }) => (
            <li key={label} className="flex items-center gap-2 text-xs font-semibold text-ink-600">
              <span aria-hidden className={cn("size-2.5 rounded-full", dot)} />
              {label}
            </li>
          ))}
        </ul>
      </div>

      {boletos.isError && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4 text-sm shadow-xs">
          <p className="text-ink-600">{mensagemErro(boletos.error)}</p>
          <Button variant="outline" onClick={() => boletos.refetch()}>Tentar novamente</Button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-7 gap-1.5 md:gap-3" aria-busy={boletos.isPending}>
        {DIAS_SEMANA.map((nome) => (
          <p key={nome} aria-hidden className="pb-1 text-center text-xs font-semibold text-ink-600 md:text-[13px]">
            {nome}
          </p>
        ))}

        {diasDoMes(ano, mes).map((dia, i) => {
          if (dia === null) {
            return <div key={`vazio-${i}`} className="h-14 rounded-md bg-surface-hover/50 md:h-28" />;
          }

          const data = dataISO(ano, mes, dia);
          const doDia = porDia.get(data) ?? [];
          const cor = doDia.length ? COR_DIA[corDoDia(doDia)] : null;
          const ehHoje = data === hoje;
          const dataPorExtenso = new Date(ano, mes, dia).toLocaleDateString("pt-BR", { day: "numeric", month: "long" });

          return (
            <button
              key={data}
              type="button"
              disabled={!cor}
              onClick={() => setDiaAberto(data)}
              aria-label={cor ? `${dataPorExtenso}: ${plural(doDia.length)}, ${cor.label.toLowerCase()}` : dataPorExtenso}
              aria-current={ehHoje ? "date" : undefined}
              className={cn(
                "@container flex h-14 flex-col items-start rounded-md border bg-card p-1.5 text-left shadow-xs transition-colors md:h-28 md:p-3",
                cor && "cursor-pointer hover:border-border-strong hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                ehHoje && "border-brand-500",
              )}
            >
              <span className={cn("text-sm font-bold md:text-lg", ehHoje && "text-brand-500")}>{dia}</span>
              {cor && (
                <>
                  {/* Decide pela largura da célula (container query): estreita = bolinha + número; larga = chip "2 vencimentos". */}
                  <span className="mt-auto flex items-center gap-1 text-xs font-bold @[7rem]:hidden">
                    <span aria-hidden className={cn("size-2 rounded-full", cor.dot)} />
                    {doDia.length}
                  </span>
                  <span className={cn("mt-2 hidden items-center gap-2 rounded-sm px-2 py-1 text-xs font-semibold @[7rem]:flex", cor.chip)}>
                    <span aria-hidden className={cn("size-2 shrink-0 rounded-full", cor.dot)} />
                    {plural(doDia.length)}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>

      <Modal
        aberto={!!diaAberto}
        onFechar={() => setDiaAberto(null)}
        titulo={diaAberto ? new Date(`${diaAberto}T12:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "long" }) : ""}
        descricao={plural(boletosDoDia.length)}
      >
        <ul>
          {boletosDoDia.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-4 border-b py-3 last:border-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{b.descricao}</p>
                {/* Na aba "Todos" o dia mistura boletos de várias pessoas. */}
                <p className="truncate text-xs text-ink-600">{b.responsavelNome}</p>
                <StatusDot status={b.status} className="mt-1 text-xs" />
              </div>
              <p className="shrink-0 font-mono text-sm font-bold tabular-nums">{formatarMoeda(b.valor)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={() => setDiaAberto(null)}>Fechar</Button>
        </div>
      </Modal>
    </>
  );
}
