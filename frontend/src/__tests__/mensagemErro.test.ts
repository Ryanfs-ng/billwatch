import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";
import { mensagemErro, mensagemPorStatus } from "@/lib/utils";

function erroHttp(status: number, headers: Record<string, string> = {}) {
  const response = { status, headers: new AxiosHeaders(headers), data: "" } as unknown as AxiosResponse;
  return new AxiosError("erro", "ERR_BAD_REQUEST", undefined, undefined, response);
}

describe("mensagemErro", () => {
  it("429 usa o Retry-After e ignora o mapa por status", () => {
    expect(mensagemErro(erroHttp(429, { "retry-after": "1" }))).toBe("Muitas tentativas. Tente novamente em 1 segundo.");
    expect(mensagemErro(erroHttp(429, { "retry-after": "45" }))).toBe("Muitas tentativas. Tente novamente em 45 segundos.");
    expect(mensagemErro(erroHttp(429, { "retry-after": "61" }))).toBe("Muitas tentativas. Tente novamente em 2 minutos.");
    expect(mensagemPorStatus(erroHttp(429), { 401: "x" })).toBe("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
  });

  it("outros status seguem o mapa ou o padrão informado", () => {
    expect(mensagemPorStatus(erroHttp(401), { 401: "E-mail ou senha inválidos." })).toBe("E-mail ou senha inválidos.");
    expect(mensagemPorStatus(erroHttp(500), {}, "Não foi possível entrar.")).toBe("Não foi possível entrar.");
  });
});
