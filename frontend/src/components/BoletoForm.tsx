import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { anexarArquivo, criarBoleto, editarBoleto } from "@/api/boletos";
import { listarUsuarios } from "@/api/usuarios";
import { Modal } from "@/components/Modal";
import { preferePoucoMovimento, SucessoAnimado } from "@/components/SucessoAnimado";
import { Button } from "@/components/ui/button";
import { HaloDropzone } from "@/components/ui/halo-dropzone";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { inputClass, mensagemErro } from "@/lib/utils";
import type { Boleto } from "@/types";

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
            <label htmlFor="responsavelId" className={label}>Responsável</label>
            {usuarios.data ? (
              <select id="responsavelId" name="responsavelId" defaultValue={responsavelPadrao} className={inputClass}>
                {usuarios.data.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email === email ? `${u.nome} (você)` : u.nome}
                  </option>
                ))}
              </select>
            ) : (
              <select id="responsavelId" disabled className={inputClass}>
                <option>{usuarios.isError ? "Não foi possível carregar (fica com você)" : "Carregando…"}</option>
              </select>
            )}
          </div>

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
