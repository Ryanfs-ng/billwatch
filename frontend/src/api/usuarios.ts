import { http } from "./http";
import type { Perfil, PreferenciasNotificacao, Usuario } from "../types";

export async function listarUsuarios(): Promise<Usuario[]> {
  const { data } = await http.get<Usuario[]>("/usuarios");
  return data;
}

export async function buscarPerfil(): Promise<Perfil> {
  const { data } = await http.get<Perfil>("/usuarios/eu");
  return data;
}

export async function alterarEmail(payload: { novoEmail: string; senhaAtual: string }): Promise<string> {
  const { data } = await http.put<{ token: string }>("/usuarios/eu/email", payload);
  return data.token;
}

export async function alterarSenha(payload: { senhaAtual: string; novaSenha: string }): Promise<string> {
  const { data } = await http.put<{ token: string }>("/usuarios/eu/senha", payload);
  return data.token;
}

export async function salvarNotificacoes(payload: PreferenciasNotificacao): Promise<Perfil> {
  const { data } = await http.put<Perfil>("/usuarios/eu/notificacoes", payload);
  return data;
}

export async function enviarFoto(arquivo: File): Promise<Perfil> {
  const form = new FormData();
  form.append("arquivo", arquivo);
  const { data } = await http.put<Perfil>("/usuarios/eu/foto", form);
  return data;
}

export async function removerFoto(): Promise<void> {
  await http.delete("/usuarios/eu/foto");
}

export async function baixarFoto(id: string): Promise<Blob> {
  const { data } = await http.get<Blob>(`/usuarios/${id}/foto`, { responseType: "blob" });
  return data;
}
