export type StatusBoleto = "PAGO" | "ATRASADO" | "A_VENCER" | "PENDENTE";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  createdAt: string;
}

export interface Boleto {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataAnexado: string;
  dataPagamento: string | null;
  anexo: string | null;
  responsavel: Usuario;
  notificadoEm: string | null;
  status: StatusBoleto;
}

export interface DashboardAgregados {
  totalAtrasados: number;
  totalAVencer: number;
  somaEmAberto: number;
  somaPagaNoMes: number;
}
