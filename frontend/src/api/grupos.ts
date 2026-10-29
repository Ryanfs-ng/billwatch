import { http } from "./http";
import type { Grupo } from "../types";

export async function buscarMeuGrupo(): Promise<Grupo | null> {
  const { data } = await http.get<Grupo | "">("/grupos/meu");
  return data || null;
}

export async function criarGrupo(nome: string): Promise<Grupo> {
  const { data } = await http.post<Grupo>("/grupos", { nome });
  return data;
}

export async function entrarNoGrupo(codigo: string): Promise<Grupo> {
  const { data } = await http.post<Grupo>("/grupos/entrar", { codigo });
  return data;
}

export async function sairDoGrupo(): Promise<void> {
  await http.post("/grupos/sair");
}

export async function gerarNovoCodigo(): Promise<Grupo> {
  const { data } = await http.post<Grupo>("/grupos/codigo");
  return data;
}
