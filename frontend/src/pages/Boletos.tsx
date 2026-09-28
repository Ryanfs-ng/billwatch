import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheck, FileText, Paperclip, Pencil, Plus, Trash2 } from "lucide-react";
import {
  anexarArquivo,
  baixarAnexo,
  excluirBoleto,
  listarMeusBoletos,
  listarTodosBoletos,
  marcarComoPago,
} from "@/api/boletos";
import { BoletoForm } from "@/components/BoletoForm";
import { IconButton } from "@/components/IconButton";
import { Modal } from "@/components/Modal";
import { STATUS, StatusDot } from "@/components/StatusDot";
import { Button } from "@/components/ui/button";
import { cn, formatarData, formatarMoeda, hojeISO, inputClass, mensagemErro } from "@/lib/utils";
import type { Boleto, StatusBoleto } from "@/types";

type Aba = "meus" | "todos";
export type Periodo = "qualquer" | "7" | "30" | "mes";

export interface Filtros {
  busca: string;
  status: StatusBoleto | "";
  periodo: Periodo;
}

const FILTROS_VAZIOS: Filtros = { busca: "", status: "", periodo: "qualquer" };

const PERIODOS: Record<Periodo, string> = {
  qualquer: "Qualquer período",
  "7": "Próximos 7 dias",
  "30": "Próximos 30 dias",
  mes: "Este mês",
};

export function filtrarBoletos(boletos: Boleto[], { busca, status, periodo }: Filtros, hoje = hojeISO()): Boleto[] {
  const termo = busca.trim().toLocaleLowerCase("pt-BR");
  const limite = periodo === "7" || periodo === "30" ? somarDias(hoje, Number(periodo)) : "";

  return boletos
    .filter((b) => !termo || b.descricao.toLocaleLowerCase("pt-BR").includes(termo))
    .filter((b) => !status || b.status === status)
    .filter((b) => {
      if (periodo === "qualquer") return true;
      if (periodo === "mes") return b.dataVencimento.slice(0, 7) === hoje.slice(0, 7);
      return b.dataVencimento >= hoje && b.dataVencimento <= limite;
    })
    .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));
}

function somarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d + dias).toLocaleDateString("sv-SE");
}

export function Boletos() {
  const [params, setParams] = useSearchParams();
  const aba: Aba = params.get("aba") === "todos" ? "todos" : "meus";
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Boleto | null>(null);
  const [excluindo, setExcluindo] = useState<Boleto | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number>(undefined);
  const inputAnexo = useRef<HTMLInputElement>(null);
  const anexandoId = useRef<string | null>(null);

  const queryClient = useQueryClient();
  const consulta = useQuery({
    queryKey: ["boletos", aba],
    queryFn: aba === "meus" ? listarMeusBoletos : listarTodosBoletos,
  });

  function avisar(mensagem: string) {
    setToast(mensagem);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3000);
  }

  const recarregar = () => queryClient.invalidateQueries({ queryKey: ["boletos"] });

  const pagar = useMutation({
    mutationFn: marcarComoPago,
    onSuccess: () => (recarregar(), avisar("Boleto marcado como pago.")),
    onError: (e) => avisar(mensagemErro(e)),
  });

  const excluir = useMutation({
    mutationFn: excluirBoleto,
    onSuccess: () => (recarregar(), setExcluindo(null), avisar("Boleto excluído.")),
    onError: (e) => avisar(mensagemErro(e)),
  });

  const anexar = useMutation({
    mutationFn: ({ id, arquivo }: { id: string; arquivo: File }) => anexarArquivo(id, arquivo),
    onSuccess: () => (recarregar(), avisar("Anexo enviado.")),
    onError: (e) => avisar(mensagemErro(e)),
  });

  function abrirAnexo(boleto: Boleto) {
    if (boleto.anexo) {
      baixarAnexo(boleto).catch((e) => avisar(mensagemErro(e)));
      return;
    }
    anexandoId.current = boleto.id;
    inputAnexo.current?.click();
  }

  function aoEscolherArquivo(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (arquivo && anexandoId.current) anexar.mutate({ id: anexandoId.current, arquivo });
    e.target.value = "";
  }

  function abrirForm(boleto: Boleto | null) {
    setEditando(boleto);
    setFormAberto(true);
  }

  const boletos = consulta.data ?? [];
  const visiveis = filtrarBoletos(boletos, filtros);
  const temFiltro = filtros.busca !== "" || filtros.status !== "" || filtros.periodo !== "qualquer";

  const acoes = (boleto: Boleto, className?: string) => (
    <div className="flex items-center gap-1">
      <IconButton
        label={boleto.anexo ? "Baixar anexo" : "Anexar arquivo"}
        onClick={() => abrirAnexo(boleto)}
        className={cn(className, boleto.anexo && "text-brand-500")}
      >
        <Paperclip />
      </IconButton>
      <IconButton label="Editar" onClick={() => abrirForm(boleto)} className={className}>
        <Pencil />
      </IconButton>
      <IconButton
        label={boleto.status === "PAGO" ? "Já está pago" : "Marcar como pago"}
        disabled={boleto.status === "PAGO" || pagar.isPending}
        onClick={() => pagar.mutate(boleto.id)}
        className={cn(className, "hover:text-pago")}
      >
        <CircleCheck />
      </IconButton>
      <IconButton label="Excluir" onClick={() => setExcluindo(boleto)} className={cn(className, "hover:text-atrasado")}>
        <Trash2 />
      </IconButton>
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-[28px]">Boletos</h1>
        <Button onClick={() => abrirForm(null)}>
          <Plus data-icon="inline-start" className="size-5" />
          Novo boleto
        </Button>
      </div>

      <div role="tablist" aria-label="Filtrar por responsável" className="mt-6 flex gap-2 border-b">
        {(["meus", "todos"] as const).map((valor) => (
          <button
            key={valor}
            role="tab"
            type="button"
            aria-selected={aba === valor}
            onClick={() => setParams(valor === "todos" ? { aba: "todos" } : {}, { replace: true })}
            className={cn(
              "-mb-px h-11 cursor-pointer border-b-2 border-transparent px-2 text-[15px] font-semibold text-ink-600 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
              aba === valor && "border-brand-500 text-brand-700 hover:text-brand-700",
            )}
          >
            {valor === "meus" ? "Meus boletos" : "Todos os boletos"}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:flex lg:items-end">
        <div className="lg:w-60">
          <label htmlFor="busca" className="mb-1.5 block text-[13px] font-semibold">Buscar boleto</label>
          <input
            id="busca"
            type="search"
            placeholder="Descrição"
            value={filtros.busca}
            onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
            className={inputClass}
          />
        </div>
        <div className="lg:w-60">
          <label htmlFor="status" className="mb-1.5 block text-[13px] font-semibold">Status</label>
          <select
            id="status"
            value={filtros.status}
            onChange={(e) => setFiltros({ ...filtros, status: e.target.value as Filtros["status"] })}
            className={inputClass}
          >
            <option value="">Todos</option>
            {Object.entries(STATUS).map(([valor, { label }]) => (
              <option key={valor} value={valor}>{label}</option>
            ))}
          </select>
        </div>
        <div className="lg:w-60">
          <label htmlFor="periodo" className="mb-1.5 block text-[13px] font-semibold">Vencimento</label>
          <select
            id="periodo"
            value={filtros.periodo}
            onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value as Periodo })}
            className={inputClass}
          >
            {Object.entries(PERIODOS).map(([valor, label]) => (
              <option key={valor} value={valor}>{label}</option>
            ))}
          </select>
        </div>
        <Button variant="outline" disabled={!temFiltro} onClick={() => setFiltros(FILTROS_VAZIOS)}>
          Limpar filtros
        </Button>
      </div>

      <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2" aria-label="Legenda de status">
        {(Object.keys(STATUS) as StatusBoleto[]).map((s) => (
          <li key={s}>
            <StatusDot status={s} className="text-xs" />
          </li>
        ))}
      </ul>

      <section className="mt-4" aria-busy={consulta.isPending}>
        {consulta.isPending ? (
          <Esqueleto />
        ) : consulta.isError ? (
          <Vazio titulo="Não foi possível carregar os boletos." texto={mensagemErro(consulta.error)}>
            <Button variant="outline" onClick={() => consulta.refetch()}>Tentar novamente</Button>
          </Vazio>
        ) : visiveis.length === 0 ? (
          boletos.length === 0 ? (
            <Vazio titulo="Nenhum boleto por aqui." texto="Cadastre o primeiro para acompanhar o vencimento.">
              <Button onClick={() => abrirForm(null)}>
                <Plus data-icon="inline-start" className="size-5" />
                Novo boleto
              </Button>
            </Vazio>
          ) : (
            <Vazio titulo="Nenhum boleto corresponde aos filtros.">
              <Button variant="outline" onClick={() => setFiltros(FILTROS_VAZIOS)}>Limpar filtros</Button>
            </Vazio>
          )
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-lg border bg-card shadow-xs md:block">
              <table className="w-full text-left text-sm">
                <thead className="text-[13px] text-ink-600">
                  <tr className="border-b">
                    <th scope="col" className="px-5 py-4 font-semibold">Descrição</th>
                    <th scope="col" className="px-5 py-4 font-semibold">Responsável</th>
                    <th scope="col" className="px-5 py-4 font-semibold">Valor</th>
                    <th scope="col" className="px-5 py-4 font-semibold">Vencimento</th>
                    <th scope="col" className="px-5 py-4 font-semibold">Status</th>
                    <th scope="col" className="px-5 py-4 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {visiveis.map((b) => (
                    <tr key={b.id} className="border-b transition-colors last:border-0 hover:bg-surface-hover">
                      <td className="px-5 py-5 font-medium">{b.descricao}</td>
                      <td className="px-5 py-5 text-ink-600">{b.responsavelNome}</td>
                      <td className="px-5 py-5 font-mono font-medium tabular-nums">{formatarMoeda(b.valor)}</td>
                      <td className="px-5 py-5 tabular-nums">{formatarData(b.dataVencimento)}</td>
                      <td className="px-5 py-5"><StatusDot status={b.status} /></td>
                      <td className="px-5 py-3">{acoes(b)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="space-y-3 md:hidden">
              {visiveis.map((b) => (
                <li key={b.id} className="rounded-lg border bg-card p-4 shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold">{b.descricao}</p>
                    <p className="shrink-0 font-mono font-bold tabular-nums">{formatarMoeda(b.valor)}</p>
                  </div>
                  <p className="mt-1 text-sm text-ink-600">
                    {b.responsavelNome} · vence {formatarData(b.dataVencimento)}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t pt-2">
                    <StatusDot status={b.status} />
                    {acoes(b, "size-11")}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <input
        ref={inputAnexo}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={aoEscolherArquivo}
        tabIndex={-1}
        aria-hidden
      />

      <BoletoForm
        aberto={formAberto}
        boleto={editando}
        onFechar={() => setFormAberto(false)}
        onSalvo={(mensagem) => (setFormAberto(false), avisar(mensagem))}
      />

      <Modal
        aberto={!!excluindo}
        onFechar={() => setExcluindo(null)}
        titulo="Excluir boleto?"
        descricao={
          excluindo
            ? `"${excluindo.descricao}"${excluindo.anexo ? " e o anexo serão removidos" : " será removido"}. Essa ação não pode ser desfeita.`
            : ""
        }
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setExcluindo(null)}>Cancelar</Button>
          <Button
            className="bg-atrasado text-white hover:bg-atrasado/90"
            disabled={excluir.isPending}
            onClick={() => excluindo && excluir.mutate(excluindo.id)}
          >
            {excluir.isPending ? "Excluindo…" : "Excluir"}
          </Button>
        </div>
      </Modal>

      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center md:justify-end">
        {toast && (
          <p className="pointer-events-auto rounded-md bg-ink-900 px-4 py-3 text-sm font-medium text-surface shadow-md animate-in fade-in slide-in-from-bottom-2">
            {toast}
          </p>
        )}
      </div>
    </>
  );
}

function Esqueleto() {
  return (
    <div className="space-y-2 rounded-lg border bg-card p-4 shadow-xs" aria-label="Carregando boletos">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-md bg-surface-hover" />
      ))}
    </div>
  );
}

function Vazio({ titulo, texto, children }: { titulo: string; texto?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-lg border bg-card px-6 py-14 text-center shadow-xs">
      <span className="grid size-12 place-items-center rounded-full bg-brand-50 text-brand-500">
        <FileText className="size-6" aria-hidden />
      </span>
      <p className="mt-4 font-semibold">{titulo}</p>
      {texto && <p className="mt-1 max-w-sm text-sm text-ink-600">{texto}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
