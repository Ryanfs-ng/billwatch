export type StatusBoleto = "PAGO" | "ATRASADO" | "A_VENCER" | "PENDENTE";

// Espelha UsuarioResponse do backend.
export interface Usuario {
  id: string;
  nome: string;
  email: string;
}

export interface Boleto {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataAnexado: string | null;
  dataPagamento: string | null;
  anexo: string | null;
  responsavelId: string;
  responsavelNome: string;
  status: StatusBoleto;
}

export interface BoletoPayload {
  descricao: string;
  valor: number;
  dataVencimento: string;
  responsavelId?: string;
}

export interface DashboardAgregados {
  totalAtrasados: number;
  totalAVencer: number;
  somaEmAberto: number;
  somaPagaNoMes: number;
}
