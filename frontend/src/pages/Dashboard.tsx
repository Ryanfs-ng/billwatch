import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CircleCheck, Clock, FileText, Plus, TriangleAlert, type LucideIcon } from "lucide-react";
import { buscarDashboard, listarMeusBoletos } from "@/api/boletos";
import { BoletoForm } from "@/components/BoletoForm";
import { BarrasMensais, Sparkline } from "@/components/Graficos";
import { StatusDot } from "@/components/StatusDot";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn, formatarData, formatarMoeda, hojeISO, mensagemErro } from "@/lib/utils";
import type { Boleto } from "@/types";

const LIMITE_PROXIMOS = 5;

export function proximosVencimentos(boletos: Boleto[], limite = LIMITE_PROXIMOS): Boleto[] {
  return boletos
    .filter((b) => b.status !== "PAGO")
    .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))
    .slice(0, limite);
}

export function meses(hoje: string, deslocamento: number, quantidade = 6): string[] {
  const [a, m] = hoje.split("-").map(Number);
  return Array.from({ length: quantidade }, (_, i) =>
    new Date(a, m - 1 + deslocamento + i, 1).toLocaleDateString("sv-SE").slice(0, 7),
  );
}

export function porMes(
  boletos: Boleto[],
  lista: string[],
  mes: (b: Boleto) => string | null,
  medida: (b: Boleto) => number = () => 1,
): number[] {
  return lista.map((m) => boletos.filter((b) => mes(b)?.slice(0, 7) === m).reduce((t, b) => t + medida(b), 0));
}

const vencimento = (b: Boleto) => b.dataVencimento;
const valor = (b: Boleto) => b.valor;

export function Dashboard() {
  const { nome } = useAuth();
  const [formAberto, setFormAberto] = useState(false);

  const agregados = useQuery({ queryKey: ["boletos", "dashboard"], queryFn: buscarDashboard });
  const boletos = useQuery({ queryKey: ["boletos", "meus"], queryFn: listarMeusBoletos });

  const primeiroNome = nome?.trim().split(/\s+/)[0];
  const proximos = proximosVencimentos(boletos.data ?? []);
  const a = agregados.data;

  const lista = boletos.data ?? [];
  const passados = meses(hojeISO(), -5);
  const futuros = meses(hojeISO(), 0);
  const emAberto = lista.filter((b) => b.status !== "PAGO");
  const pagoPorMes = porMes(lista, passados, (b) => b.dataPagamento, valor);
  const sparks = boletos.data && {
    atrasados: porMes(lista.filter((b) => b.status === "ATRASADO"), passados, vencimento),
    aVencer: porMes(lista.filter((b) => b.status === "A_VENCER"), futuros, vencimento),
    emAberto: porMes(emAberto, futuros, vencimento, valor),
    pago: pagoPorMes,
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-[28px]">
          {primeiroNome ? `Olá, ${primeiroNome}` : "Olá"}
        </h1>
        <Button onClick={() => setFormAberto(true)}>
          <Plus data-icon="inline-start" className="size-5" />
          Novo boleto
        </Button>
      </div>

      {agregados.isError ? (
        <Aviso texto={mensagemErro(agregados.error)} onTentar={() => agregados.refetch()} />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 min-[481px]:grid-cols-2 xl:grid-cols-4" aria-busy={agregados.isPending}>
          <StatCard
            icone={TriangleAlert}
            label="Atrasados"
            valor={a?.totalAtrasados}
            rodape={a && (a.totalAtrasados ? "Precisam de atenção" : "Nenhum atrasado")}
            corRodape={a?.totalAtrasados ? "text-atrasado" : "text-pago"}
            serie={sparks?.atrasados}
            corSerie="text-atrasado"
            legendaSerie="Atrasados por mês de vencimento, últimos 6 meses"
          />
          <StatCard
            icone={Clock}
            label="A vencer"
            valor={a?.totalAVencer}
            rodape={a && (a.totalAVencer ? "Vencem nos próximos dias" : "Nada vencendo em breve")}
            corRodape="text-a-vencer"
            serie={sparks?.aVencer}
            corSerie="text-a-vencer"
            legendaSerie="Boletos a vencer por mês, próximos 6 meses"
          />
          <StatCard
            icone={FileText}
            label="Total em aberto"
            valor={a && formatarMoeda(a.somaEmAberto)}
            rodape="Atrasados, a vencer e pendentes"
            corRodape="text-ink-600"
            serie={sparks?.emAberto}
            corSerie="text-brand-500"
            legendaSerie="Valor em aberto por mês de vencimento, próximos 6 meses"
          />
          <StatCard
            icone={CircleCheck}
            label="Pago no mês"
            valor={a && formatarMoeda(a.somaPagaNoMes)}
            rodape={new Date(`${hojeISO()}T12:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            corRodape="text-pago"
            serie={sparks?.pago}
            corSerie="text-pago"
            legendaSerie="Valor pago por mês, últimos 6 meses"
          />
        </div>
      )}

      <section className="mt-6 rounded-lg border bg-card p-5 shadow-xs md:p-6" aria-labelledby="pago-titulo">
        <h2 id="pago-titulo" className="font-display text-lg font-extrabold tracking-tight">
          Pago por mês
        </h2>
        <p className="text-sm text-ink-600">Últimos 6 meses, pela data de pagamento.</p>
        {boletos.isPending ? (
          <div className="mt-5 h-52 animate-pulse rounded-md bg-surface-hover" aria-label="Carregando gráfico" />
        ) : boletos.isError ? (
          <Aviso texto={mensagemErro(boletos.error)} onTentar={() => boletos.refetch()} />
        ) : (
          <div className="mt-5">
            <BarrasMensais
              meses={passados.map((m, i) => ({
                rotulo: new Date(`${m}-15T12:00`).toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
                valor: pagoPorMes[i],
                atual: i === passados.length - 1,
              }))}
            />
          </div>
        )}
      </section>

      <section className="mt-6 rounded-lg border bg-card p-5 shadow-xs md:p-6" aria-labelledby="proximos-titulo">
        <div className="flex items-center justify-between gap-4">
          <h2 id="proximos-titulo" className="font-display text-lg font-extrabold tracking-tight">
            Próximos vencimentos
          </h2>
          <Link to="/calendario" viewTransition className={cn(buttonVariants({ variant: "outline" }))}>
            Ver calendário
          </Link>
        </div>

        {boletos.isPending ? (
          <div className="mt-4 space-y-2" aria-label="Carregando vencimentos">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-md bg-surface-hover" />
            ))}
          </div>
        ) : boletos.isError ? (
          <Aviso texto={mensagemErro(boletos.error)} onTentar={() => boletos.refetch()} />
        ) : proximos.length === 0 ? (
          <p className="mt-6 py-6 text-center text-sm text-ink-600">Nenhum boleto em aberto. Tudo em dia!</p>
        ) : (
          <ul className="mt-3">
            {proximos.map((b) => (
              <li
                key={b.id}
                className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-b py-3.5 last:border-0 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_8rem_8rem_8rem]"
              >
                <p className="truncate text-sm font-semibold">{b.descricao}</p>
                <p className="hidden truncate text-sm text-ink-600 md:block">{b.responsavelNome}</p>
                <StatusDot status={b.status} className="order-3 md:order-none" />
                <p className="text-right font-mono text-sm font-bold tabular-nums">{formatarMoeda(b.valor)}</p>
                <p className="order-4 text-right text-xs text-ink-600 md:order-none">
                  {b.status === "ATRASADO" ? "Venceu em " : "Vence em "}
                  {formatarData(b.dataVencimento).slice(0, 5)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <BoletoForm
        aberto={formAberto}
        boleto={null}
        onFechar={() => setFormAberto(false)}
        onSalvo={() => setFormAberto(false)}
      />
    </>
  );
}

function StatCard({ icone: Icone, label, valor, rodape, corRodape, serie, corSerie, legendaSerie }: {
  icone: LucideIcon;
  label: string;
  valor: ReactNode;
  rodape: ReactNode;
  corRodape: string;
  serie?: number[];
  corSerie: string;
  legendaSerie: string;
}) {
  const carregando = valor === undefined;
  return (
    <div className="rounded-lg border bg-card p-5 shadow-xs">
      <p className="flex items-center gap-2 text-sm font-semibold text-ink-600">
        <Icone className="size-4" aria-hidden />
        {label}
      </p>
      {carregando ? (
        <div className="mt-2 h-8 w-24 animate-pulse rounded-md bg-surface-hover" />
      ) : (
        <div className="mt-2 flex items-end justify-between gap-3">
          <p className="font-mono text-[26px] leading-8 font-bold tabular-nums">{valor}</p>
          {serie && (
            <span title={legendaSerie} className={cn("shrink-0", corSerie)}>
              <Sparkline valores={serie} />
              <span className="sr-only">{legendaSerie}</span>
            </span>
          )}
        </div>
      )}
      <p className={cn("mt-2 text-xs font-semibold first-letter:uppercase", corRodape)}>{rodape ?? " "}</p>
    </div>
  );
}

function Aviso({ texto, onTentar }: { texto: string; onTentar: () => void }) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4 text-sm shadow-xs">
      <p className="text-ink-600">{texto}</p>
      <Button variant="outline" onClick={onTentar}>Tentar novamente</Button>
    </div>
  );
}
