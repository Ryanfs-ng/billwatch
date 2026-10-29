import { http } from "./http";
import type { Usuario } from "../types";

export async function listarUsuarios(): Promise<Usuario[]> {
  const { data } = await http.get<Usuario[]>("/usuarios");
  return data;
}
