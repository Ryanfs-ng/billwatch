import { http } from "./http";

export interface LoginPayload {
  email: string;
  senha: string;
}

export interface RegistrarPayload {
  nome: string;
  email: string;
  senha: string;
}

export interface AuthResponse {
  token: string;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function solicitarRedefinicaoSenha(email: string): Promise<void> {
  await http.post("/auth/esqueci-senha", { email });
}

export interface RedefinirSenhaPayload {
  token: string;
  novaSenha: string;
}

export async function redefinirSenha(payload: RedefinirSenhaPayload): Promise<void> {
  await http.post("/auth/redefinir-senha", payload);
}

export async function registrar(payload: RegistrarPayload): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>("/auth/registrar", payload);
  return data;
}
