import axios from "axios";

export { cn } from "cn";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export const formatarMoeda = (valor: number) => moeda.format(valor);

export const formatarData = (iso: string) => iso.split("-").reverse().join("/");

export function hojeISO(dias = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toLocaleDateString("sv-SE");
}

const ERRO_PADRAO = "Não foi possível concluir a ação. Tente novamente.";

export function mensagemErro(erro: unknown, padrao = ERRO_PADRAO): string {
  if (axios.isAxiosError(erro)) {
    if (erro.response?.status === 429) return mensagemLimiteTentativas(erro.response.headers["retry-after"]);
    const msg = erro.response?.data?.message;
    if (typeof msg === "string" && msg) return msg;
  }
  return padrao;
}

export function mensagemPorStatus(erro: unknown, mensagens: Record<number, string>, padrao = ERRO_PADRAO): string {
  const status = axios.isAxiosError(erro) ? erro.response?.status : undefined;
  return (status && mensagens[status]) || mensagemErro(erro, padrao);
}

export function mensagemLimiteTentativas(retryAfter: unknown): string {
  const segundos = Math.ceil(Number(retryAfter));
  if (!(segundos > 0)) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  if (segundos < 60) return `Muitas tentativas. Tente novamente em ${segundos} ${segundos === 1 ? "segundo" : "segundos"}.`;
  const minutos = Math.ceil(segundos / 60);
  return `Muitas tentativas. Tente novamente em ${minutos} ${minutos === 1 ? "minuto" : "minutos"}.`;
}

export const inputClass =
  "h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground placeholder:text-ink-400 transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/25";
