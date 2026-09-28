import axios from "axios";

export { cn } from "cn";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export const formatarMoeda = (valor: number) => moeda.format(valor);

// "2026-09-18" -> "18/09/2026" (sem passar por Date, evita deslocamento de fuso).
export const formatarData = (iso: string) => iso.split("-").reverse().join("/");

// Data local no formato yyyy-MM-dd, deslocada em `dias`.
export function hojeISO(dias = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toLocaleDateString("sv-SE");
}

export function mensagemErro(erro: unknown): string {
  if (axios.isAxiosError(erro)) {
    const msg = erro.response?.data?.message;
    if (typeof msg === "string" && msg) return msg;
  }
  return "Não foi possível concluir a ação. Tente novamente.";
}

export const inputClass =
  "h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground placeholder:text-ink-400 transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/25";
