import type { StatusBoleto } from "../types";

const CORES: Record<StatusBoleto, string> = {
  PAGO: "#16a34a",
  A_VENCER: "#ca8a04",
  ATRASADO: "#dc2626",
  PENDENTE: "#6b7280",
};

const LABELS: Record<StatusBoleto, string> = {
  PAGO: "Pago",
  A_VENCER: "A vencer",
  ATRASADO: "Atrasado",
  PENDENTE: "Pendente",
};

export function BadgeStatus({ status }: { status: StatusBoleto }) {
  return (
    <span
      style={{
        backgroundColor: CORES[status],
        color: "white",
        borderRadius: "999px",
        padding: "2px 10px",
        fontSize: "0.75rem",
        fontWeight: 600,
      }}
    >
      {LABELS[status]}
    </span>
  );
}
