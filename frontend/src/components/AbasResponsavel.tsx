import { useSearchParams } from "react-router-dom";
import { listarMeusBoletos, listarTodosBoletos } from "@/api/boletos";
import { cn } from "@/lib/utils";

type Aba = "meus" | "todos";

// A aba fica na URL (?aba=todos), então sobrevive ao recarregar a página e pode ser compartilhada.
export function useAba(): Aba {
  const [params] = useSearchParams();
  return params.get("aba") === "todos" ? "todos" : "meus";
}

// Opções do useQuery para a aba atual. A chave é a mesma em todas as telas, então o cache é compartilhado.
export function consultaDaAba(aba: Aba) {
  return {
    queryKey: ["boletos", aba],
    queryFn: aba === "meus" ? listarMeusBoletos : listarTodosBoletos,
  };
}

export function AbasResponsavel() {
  const aba = useAba();
  const [, setParams] = useSearchParams();

  return (
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
  );
}
