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

export async function registrar(payload: RegistrarPayload): Promise<void> {
  await http.post("/auth/registrar", payload);
}

export async function confirmarEmail(token: string): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>("/auth/confirmar-email", { token });
  return data;
}

export async function entrarComGoogle(credencial: string): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>("/auth/google", { credencial });
  return data;
}

export async function confirmarNovoEmail(token: string): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>("/auth/confirmar-novo-email", { token });
  return data;
}
