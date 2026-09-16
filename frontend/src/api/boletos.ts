import { http } from "./http";
import type { Boleto, DashboardAgregados } from "../types";

export async function listarMeusBoletos(): Promise<Boleto[]> {
  const { data } = await http.get<Boleto[]>("/boletos/meus");
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

export async function criarBoleto(payload: FormData): Promise<Boleto> {
  const { data } = await http.post<Boleto>("/boletos", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function editarBoleto(id: string, payload: Partial<Boleto>): Promise<Boleto> {
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
