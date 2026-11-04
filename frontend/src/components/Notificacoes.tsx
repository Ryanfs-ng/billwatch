import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Bell, BellCheck } from "lucide-react";
import { listarMeusBoletos } from "@/api/boletos";
import { IconButton } from "@/components/IconButton";
import { STATUS } from "@/components/StatusDot";
import { buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, formatarMoeda, hojeISO } from "@/lib/utils";
import type { Boleto } from "@/types";

const DIA_MS = 86_400_000;

function prazo(vencimento: string) {
  const dias = Math.round((Date.parse(vencimento) - Date.parse(hojeISO())) / DIA_MS);
  if (dias < -1) return `Venceu há ${-dias} dias`;
  if (dias === -1) return "Venceu ontem";
  if (dias === 0) return "Vence hoje";
  if (dias === 1) return "Vence amanhã";
  return `Vence em ${dias} dias`;
}

function pendencias(boletos: Boleto[]) {
  return boletos
    .filter((b) => b.status === "ATRASADO" || b.status === "A_VENCER")
    .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));
}

export function Notificacoes() {
  const [aberto, setAberto] = useState(false);
  const boletos = useQuery({ queryKey: ["boletos", "meus"], queryFn: listarMeusBoletos });
  const itens = pendencias(boletos.data ?? []);
  const atrasados = itens.filter((b) => b.status === "ATRASADO").length;

  const rotulo = itens.length === 0 ? "Notificações" : `Notificações: ${itens.length} boletos precisam de atenção`;

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger
        render={
          <IconButton label={rotulo} className="relative size-10 border">
            <Bell />
            {itens.length > 0 && (
              <span
                aria-hidden
                className={cn(
                  "absolute -top-1 -right-1 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 font-mono text-[11px] font-bold text-card ring-2 ring-card",
                  atrasados > 0 ? "bg-atrasado" : "bg-a-vencer",
                )}
              >
                {itens.length > 9 ? "9+" : itens.length}
              </span>
            )}
          </IconButton>
        }
      />
      <PopoverContent align="end" sideOffset={8} className="w-[min(22rem,calc(100vw-2rem))] gap-0 rounded-2xl border border-border-strong p-0 ring-0">
        <div className="border-b px-4 py-3">
          <h2 className="font-display text-base font-extrabold tracking-tight">Notificações</h2>
          {itens.length > 0 && (
            <p className="text-xs text-ink-600">
              {atrasados > 0 && `${atrasados} ${atrasados === 1 ? "atrasado" : "atrasados"}`}
              {atrasados > 0 && itens.length > atrasados && " · "}
              {itens.length > atrasados && `${itens.length - atrasados} a vencer`}
            </p>
          )}
        </div>

        {boletos.isPending ? (
          <p className="px-4 py-8 text-center text-sm text-ink-600">Carregando…</p>
        ) : boletos.isError ? (
          <p className="px-4 py-8 text-center text-sm text-ink-600">Não foi possível carregar as notificações.</p>
        ) : itens.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <BellCheck aria-hidden className="size-6 text-pago" />
            <p className="text-sm font-semibold">Tudo em dia!</p>
            <p className="text-xs text-ink-600">Nenhum boleto seu atrasado ou perto de vencer.</p>
          </div>
        ) : (
          <ul className="max-h-80 overflow-y-auto">
            {itens.map((b) => (
              <li key={b.id} className="flex items-start gap-3 border-b px-4 py-3 last:border-0">
                <span aria-hidden className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", STATUS[b.status].dot)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{b.descricao}</p>
                  <p className={cn("text-xs", b.status === "ATRASADO" ? "font-semibold text-atrasado" : "text-ink-600")}>
                    <span className="sr-only">{STATUS[b.status].label}: </span>
                    {prazo(b.dataVencimento)}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-sm font-semibold">{formatarMoeda(b.valor)}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t p-2">
          <Link
            to="/boletos"
            viewTransition
            onClick={() => setAberto(false)}
            className={cn(buttonVariants({ variant: "ghost" }), "h-9 w-full")}
          >
            Ver todos os boletos
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
