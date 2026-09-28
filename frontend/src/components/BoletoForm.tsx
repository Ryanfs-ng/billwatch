import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { anexarArquivo, criarBoleto, editarBoleto } from "@/api/boletos";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { inputClass, mensagemErro } from "@/lib/utils";
import type { Boleto } from "@/types";

interface BoletoFormProps {
  aberto: boolean;
  boleto: Boleto | null; // null = novo boleto
  onFechar: () => void;
  onSalvo: (mensagem: string) => void;
}

const label = "mb-1.5 block text-[13px] font-semibold";

export function BoletoForm({ aberto, boleto, onFechar, onSalvo }: BoletoFormProps) {
  const queryClient = useQueryClient();
  const [erro, setErro] = useState<string | null>(null);

  const salvar = useMutation({
    mutationFn: async (form: FormData) => {
      const payload = {
        descricao: String(form.get("descricao")).trim(),
        valor: Number(form.get("valor")),
        dataVencimento: String(form.get("dataVencimento")),
      };
      const salvo = boleto ? await editarBoleto(boleto.id, payload) : await criarBoleto(payload);

      // O anexo é outro request: se falhar, o boleto já existe e não pode ser recriado ao reenviar.
      const arquivo = form.get("arquivo");
      if (arquivo instanceof File && arquivo.size > 0) {
        try {
          await anexarArquivo(salvo.id, arquivo);
        } catch (e) {
          return `Boleto salvo, mas o anexo não foi enviado: ${mensagemErro(e)}`;
        }
      }
      return boleto ? "Boleto atualizado." : "Boleto criado.";
    },
    onSuccess: (mensagem) => {
      queryClient.invalidateQueries({ queryKey: ["boletos"] });
      onSalvo(mensagem);
    },
    onError: (e) => setErro(mensagemErro(e)),
  });

  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    salvar.mutate(new FormData(e.currentTarget));
  }

  function fechar() {
    setErro(null);
    onFechar();
  }

  return (
    <Modal
      aberto={aberto}
      onFechar={fechar}
      titulo={boleto ? "Editar boleto" : "Novo boleto"}
      descricao={boleto ? undefined : "O boleto será atribuído a você."}
    >
      <form onSubmit={enviar} className="space-y-4">
        <div>
          <label htmlFor="descricao" className={label}>Descrição</label>
          <input
            id="descricao"
            name="descricao"
            required
            autoFocus
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
            <input
              id="dataVencimento"
              name="dataVencimento"
              type="date"
              required
              defaultValue={boleto?.dataVencimento}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="arquivo" className={label}>
            {boleto?.anexo ? "Substituir anexo" : "Anexo"} <span className="font-normal text-ink-600">(opcional)</span>
          </label>
          <input
            id="arquivo"
            name="arquivo"
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            className={`${inputClass} h-auto py-2 file:mr-3 file:rounded-sm file:border-0 file:bg-brand-50 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-brand-700`}
          />
          <p className="mt-1 text-xs text-ink-600">PDF, JPG ou PNG.</p>
        </div>

        {erro && (
          <p role="alert" className="rounded-md bg-atrasado-bg px-3 py-2 text-sm font-medium text-atrasado">
            {erro}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={fechar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={salvar.isPending}>
            {salvar.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
