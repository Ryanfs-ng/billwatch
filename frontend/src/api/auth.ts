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

export async function registrar(payload: RegistrarPayload): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>("/auth/registrar", payload);
  return data;
}
