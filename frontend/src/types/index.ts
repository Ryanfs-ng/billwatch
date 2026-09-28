export type StatusBoleto = "PAGO" | "ATRASADO" | "A_VENCER" | "PENDENTE";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  createdAt: string;
}

// Espelha BoletoResponse do backend.
export interface Boleto {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: string; // yyyy-MM-dd
  dataAnexado: string | null;
  dataPagamento: string | null;
  anexo: string | null;
  responsavelId: string;
  responsavelNome: string;
  status: StatusBoleto;
}

// Espelha BoletoRequest do backend.
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
