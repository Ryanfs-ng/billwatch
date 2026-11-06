import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileQuestion } from "lucide-react";
import { buscarAnexo, salvarArquivo } from "@/api/boletos";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { mensagemErro } from "@/lib/utils";
import type { Boleto } from "@/types";

interface BoletoAnexoProps {
  boleto: Boleto | null;
  onFechar: () => void;
}

const AREA = "h-[min(65vh,40rem)] w-full rounded-lg border bg-surface-sunken";

export function BoletoAnexo({ boleto, onFechar }: BoletoAnexoProps) {
  const arquivo = useQuery({
    queryKey: ["anexo", boleto?.id, boleto?.anexo],
    queryFn: () => buscarAnexo(boleto!.id),
    enabled: !!boleto?.anexo,
    staleTime: Infinity,
    gcTime: 60_000,
  });
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    if (!arquivo.data) return;
    const criada = URL.createObjectURL(arquivo.data);
    setUrl(criada);
    return () => {
      URL.revokeObjectURL(criada);
      setUrl(undefined);
    };
  }, [arquivo.data]);

  const tipo = arquivo.data?.type ?? "";
  const nome = boleto?.anexo ?? "anexo";

  return (
    <Modal aberto={!!boleto} onFechar={onFechar} titulo="Anexo" descricao={boleto?.descricao} largo>
      {arquivo.isError ? (
        <p role="alert" className="py-10 text-center text-sm text-ink-600">
          {mensagemErro(arquivo.error, "Não foi possível carregar o anexo.")}
        </p>
      ) : !url ? (
        <div role="status" aria-label="Carregando anexo" className={`${AREA} animate-pulse motion-reduce:animate-none`} />
      ) : tipo.startsWith("image/") ? (
        <img src={url} alt={`Anexo do boleto ${boleto?.descricao ?? ""}`} className={`${AREA} object-contain`} />
      ) : tipo === "application/pdf" ? (
        <iframe src={url} title={`Anexo do boleto ${boleto?.descricao ?? ""}`} className={AREA} />
      ) : (
        <div className={`${AREA} flex flex-col items-center justify-center gap-2 text-sm text-ink-600`}>
          <FileQuestion aria-hidden className="size-8 text-ink-400" />
          Não dá para pré-visualizar este arquivo. Baixe para abrir.
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onFechar}>
          Fechar
        </Button>
        <Button disabled={!arquivo.data} onClick={() => arquivo.data && salvarArquivo(arquivo.data, nome)} className="gap-2">
          <Download aria-hidden className="size-4" />
          Baixar anexo
        </Button>
      </div>
    </Modal>
  );
}
