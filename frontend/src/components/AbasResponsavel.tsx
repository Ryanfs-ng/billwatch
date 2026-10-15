import { useId } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { listarMeusBoletos, listarTodosBoletos } from "@/api/boletos";
import { cn } from "@/lib/utils";

type Aba = "meus" | "todos";

export function useAba(): Aba {
  const [params] = useSearchParams();
  return params.get("aba") === "todos" ? "todos" : "meus";
}

export function consultaDaAba(aba: Aba) {
  return {
    queryKey: ["boletos", aba],
    queryFn: aba === "meus" ? listarMeusBoletos : listarTodosBoletos,
  };
}

export function AbasResponsavel() {
  const aba = useAba();
  const [, setParams] = useSearchParams();
  const idSublinhado = useId();
  const poucoMovimento = useReducedMotion();

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
            "relative h-11 cursor-pointer px-2 text-[15px] font-semibold text-ink-600 transition-colors duration-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
            aba === valor && "text-brand-700 hover:text-brand-700",
          )}
        >
          {valor === "meus" ? "Meus boletos" : "Todos os boletos"}
          {aba === valor && (
            <motion.span
              layoutId={idSublinhado}
              aria-hidden
              className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-500"
              transition={poucoMovimento ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 38 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
