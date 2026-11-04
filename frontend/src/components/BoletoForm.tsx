import { useRef, useState, type FormEvent } from "react";
import { CalendarDays } from "lucide-react";
import { ptBR } from "react-day-picker/locale";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { anexarArquivo, criarBoleto, editarBoleto } from "@/api/boletos";
import { listarUsuarios } from "@/api/usuarios";
import { Modal } from "@/components/Modal";
import { preferePoucoMovimento, SucessoAnimado } from "@/components/SucessoAnimado";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { HaloDropzone } from "@/components/ui/halo-dropzone";
import {
  HaloSelect,
  HaloSelectContent,
  HaloSelectItem,
  HaloSelectTrailingIndicator,
  HaloSelectTrigger,
  HaloSelectValue,
  type PolishedSelectItem,
} from "@/components/ui/halo-select";
import { HaloSwitch } from "@/components/ui/halo-switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { cn, formatarData, inputClass, mensagemErro } from "@/lib/utils";
import type { Boleto, Usuario } from "@/types";

interface BoletoFormProps {
  aberto: boolean;
  boleto: Boleto | null;
  onFechar: () => void;
  onSalvo: () => void;
}

const label = "mb-1.5 block text-[13px] font-semibold";

export function BoletoForm({ aberto, boleto, onFechar, onSalvo }: BoletoFormProps) {
  const queryClient = useQueryClient();
  const [sucesso, setSucesso] = useState<string | null>(null);
  const { email } = useAuth();
  const usuarios = useQuery({ queryKey: ["usuarios"], queryFn: listarUsuarios, enabled: aberto });
  const responsavelPadrao = boleto?.responsavelId ?? usuarios.data?.find((u) => u.email === email)?.id;

  function concluir() {
    setSucesso(null);
    onSalvo();
  }

  const salvar = useMutation({
    mutationFn: async (form: FormData) => {
      const payload = {
        descricao: String(form.get("descricao")).trim(),
        valor: Number(form.get("valor")),
        dataVencimento: String(form.get("dataVencimento")),
        responsavelId: String(form.get("responsavelId") ?? "") || undefined,
        recorrente: form.get("recorrente") === "on",
        aplicarAosProximos: form.get("aplicarAosProximos") === "on",
      };
      const salvo = boleto ? await editarBoleto(boleto.id, payload) : await criarBoleto(payload);

      const arquivo = form.get("arquivo");
      if (arquivo instanceof File && arquivo.size > 0) {
        try {
          await anexarArquivo(salvo.id, arquivo);
        } catch (e) {
          return { aviso: true, mensagem: `Boleto salvo, mas o anexo não foi enviado: ${mensagemErro(e)}` };
        }
      }
      return { aviso: false, mensagem: boleto ? "Boleto atualizado." : "Boleto criado." };
    },
    onSuccess: ({ aviso, mensagem }) => {
      queryClient.invalidateQueries({ queryKey: ["boletos"] });
      if (aviso) {
        toast.warning(mensagem);
        onSalvo();
      } else if (preferePoucoMovimento()) {
        toast.success(mensagem);
        onSalvo();
      } else {
        setSucesso(mensagem);
      }
    },
    onError: (e) => toast.error(mensagemErro(e)),
  });

  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    salvar.mutate(new FormData(e.currentTarget));
  }

  function fechar() {
    setSucesso(null);
    onFechar();
  }

  return (
    <Modal
      aberto={aberto}
      onFechar={fechar}
      titulo={boleto ? "Editar boleto" : "Novo boleto"}
    >
      {sucesso ? (
        <SucessoAnimado mensagem={sucesso} onConcluir={concluir} />
      ) : (
        <form onSubmit={enviar} className="space-y-4">
          <div>
            <label htmlFor="descricao" className={label}>Descrição</label>
            <input
              id="descricao"
              name="descricao"
              required
                defaultValue={boleto?.descricao}
              placeholder="Ex.: Conta de luz"
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="valor" className={label}>Valor (R$)</label>
              <input
                id="valor"
                name="valor"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                required
                defaultValue={boleto?.valor}
                placeholder="0,00"
                className={`${inputClass} font-mono`}
              />
            </div>
            <div>
              <label htmlFor="dataVencimento" className={label}>Vencimento</label>
              <CampoData id="dataVencimento" name="dataVencimento" inicial={boleto?.dataVencimento} />
            </div>
          </div>

          <div>
            <label htmlFor="responsavelId" className={label}>Responsável</label>
            {usuarios.data ? (
              <CampoResponsavel usuarios={usuarios.data} emailLogado={email} inicial={responsavelPadrao} />
            ) : (
              <select id="responsavelId" disabled className={inputClass}>
                <option>{usuarios.isError ? "Não foi possível carregar (fica com você)" : "Carregando…"}</option>
              </select>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-border-strong bg-card p-3">
            <div>
              <span id="recorrente-titulo" className="block text-sm font-semibold">Repetir todo mês</span>
              <span id="recorrente-texto" className="block text-xs text-ink-600">
                {boleto?.recorrente
                  ? "Desligar encerra a repetição a partir deste mês, inclusive nos meses já criados."
                  : "O boleto do mês seguinte é criado automaticamente, com a mesma descrição, valor e responsável."}
              </span>
            </div>
            <HaloSwitch
              name="recorrente"
              value="on"
              defaultChecked={boleto?.recorrente}
              aria-labelledby="recorrente-titulo"
              aria-describedby="recorrente-texto"
            />
          </div>

          {boleto?.recorrente && boleto.proximoGerado && (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border-strong bg-card p-3">
              <div>
                <span id="proximos-titulo" className="block text-sm font-semibold">Aplicar aos próximos meses</span>
                <span id="proximos-texto" className="block text-xs text-ink-600">
                  Atualiza descrição, valor e responsável dos boletos já criados para os meses seguintes que ainda não foram pagos.
                </span>
              </div>
              <HaloSwitch
                name="aplicarAosProximos"
                value="on"
                aria-labelledby="proximos-titulo"
                aria-describedby="proximos-texto"
              />
            </div>
          )}

          <div>
            <label htmlFor="arquivo" className={label}>
              {boleto?.anexo ? "Substituir anexo" : "Anexo"} <span className="font-normal text-ink-600">(opcional)</span>
            </label>
            <HaloDropzone
              id="arquivo"
              name="arquivo"
              accept="application/pdf,image/jpeg,image/png"
              formatHint="PDF, JPG ou PNG."
              onRejeitado={() => toast.error("Envie um arquivo PDF, JPG ou PNG.")}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={fechar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvar.isPending}>
              {salvar.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function isoParaData(iso: string) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function diaParaFocar(calendario: HTMLElement | null) {
  return (
    calendario?.querySelector<HTMLElement>("[data-selected=true] button") ??
    calendario?.querySelector<HTMLElement>("[data-today=true] button") ??
    true
  );
}

function CampoData({ id, name, inicial }: { id: string; name: string; inicial?: string }) {
  const [valor, setValor] = useState(inicial ?? "");
  const [aberto, setAberto] = useState(false);
  const calendario = useRef<HTMLDivElement>(null);
  const selecionada = valor ? isoParaData(valor) : undefined;

  return (
    <div className="relative">
      <Popover open={aberto} onOpenChange={setAberto}>
        <PopoverTrigger
          id={id}
          className={cn(inputClass, "flex items-center gap-2 text-left", !valor && "text-ink-400")}
        >
          <CalendarDays aria-hidden className="size-4 shrink-0 text-ink-600" />
          {valor ? formatarData(valor) : "Selecione a data"}
        </PopoverTrigger>
        <PopoverContent align="start" initialFocus={() => diaParaFocar(calendario.current)} className="w-auto rounded-2xl border border-border-strong p-1 ring-0">
          <div ref={calendario}>
          <Calendar
            mode="single"
            locale={ptBR}
            selected={selecionada}
            defaultMonth={selecionada}
            autoFocus
            onSelect={(data) => {
              if (data) setValor(data.toLocaleDateString("sv-SE"));
              setAberto(false);
            }}
            className="[--cell-size:--spacing(9)]"
            classNames={{
              today: "rounded-(--cell-radius) font-bold text-brand-700",
              caption_label: "text-sm font-semibold capitalize",
            }}
          />
          </div>
        </PopoverContent>
      </Popover>
      <input
        name={name}
        value={valor}
        onChange={() => {}}
        required
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-0"
      />
    </div>
  );
}

interface CampoResponsavelProps {
  usuarios: Usuario[];
  emailLogado: string | null;
  inicial?: string;
}

function CampoResponsavel({ usuarios, emailLogado, inicial }: CampoResponsavelProps) {
  const opcoes: PolishedSelectItem[] = usuarios.map((u) => ({
    value: u.id,
    label: u.email === emailLogado ? `${u.nome} (você)` : u.nome,
  }));
  const [selecionado, setSelecionado] = useState(() => opcoes.find((o) => o.value === inicial) ?? null);

  return (
    <>
      <HaloSelect
        className="w-full"
        items={opcoes}
        isItemEqualToValue={(a, b) => (a as PolishedSelectItem).value === (b as PolishedSelectItem).value}
        value={selecionado}
        onValueChange={(opcao) => setSelecionado(opcao as PolishedSelectItem | null)}
      >
        <HaloSelectTrigger id="responsavelId" className="w-full max-w-none">
          <HaloSelectValue />
          <HaloSelectTrailingIndicator />
        </HaloSelectTrigger>
        <HaloSelectContent>
          {opcoes.map((opcao, i) => (
            <HaloSelectItem index={i} key={opcao.value} label={opcao.label} value={opcao}>
              {opcao.label}
            </HaloSelectItem>
          ))}
        </HaloSelectContent>
      </HaloSelect>
      <input type="hidden" name="responsavelId" value={selecionado?.value ?? ""} />
    </>
  );
}
