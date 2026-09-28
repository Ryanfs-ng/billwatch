import { cn } from "@/lib/utils";
import type { StatusBoleto } from "@/types";

// Ordem usada na legenda e no filtro.
export const STATUS: Record<StatusBoleto, { label: string; dot: string }> = {
  PAGO: { label: "Pago", dot: "bg-pago" },
  A_VENCER: { label: "A vencer", dot: "bg-a-vencer" },
  ATRASADO: { label: "Atrasado", dot: "bg-atrasado" },
  PENDENTE: { label: "Pendente", dot: "bg-pendente" },
};

// Bolinha + texto: o status nunca depende só da cor.
export function StatusDot({ status, className }: { status: StatusBoleto; className?: string }) {
  const { label, dot } = STATUS[status];
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm font-semibold text-ink-600", className)}>
      <span aria-hidden className={cn("size-2.5 shrink-0 rounded-full", dot)} />
      {label}
    </span>
  );
}
