import { http } from "./http";
import type { Boleto, BoletoPayload, DashboardAgregados } from "../types";

export async function listarMeusBoletos(): Promise<Boleto[]> {
  const { data } = await http.get<Boleto[]>("/boletos/meus-boletos");
  return data;
}

export async function listarTodosBoletos(): Promise<Boleto[]> {
  const { data } = await http.get<Boleto[]>("/boletos");
  return data;
}

export async function buscarDashboard(): Promise<DashboardAgregados> {
  const { data } = await http.get<DashboardAgregados>("/boletos/dashboard");
  return data;
}

export async function criarBoleto(payload: BoletoPayload): Promise<Boleto> {
  const { data } = await http.post<Boleto>("/boletos", payload);
  return data;
}

export async function editarBoleto(id: string, payload: BoletoPayload): Promise<Boleto> {
  const { data } = await http.put<Boleto>(`/boletos/${id}`, payload);
  return data;
}

export async function marcarComoPago(id: string): Promise<Boleto> {
  const { data } = await http.patch<Boleto>(`/boletos/${id}/pagar`);
  return data;
}

export async function excluirBoleto(id: string): Promise<void> {
  await http.delete(`/boletos/${id}`);
}

export async function anexarArquivo(id: string, arquivo: File): Promise<Boleto> {
  const form = new FormData();
  form.append("arquivo", arquivo);
  const { data } = await http.put<Boleto>(`/boletos/${id}/anexos`, form);
  return data;
}

export async function buscarAnexo(id: string): Promise<Blob> {
  const { data } = await http.get<Blob>(`/boletos/${id}/anexo`, { responseType: "blob" });
  return data;
}

export function salvarArquivo(arquivo: Blob, nome: string): void {
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.click();
  URL.revokeObjectURL(url);
}
