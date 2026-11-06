import type { Page, Route } from "@playwright/test";

export const API = "http://api.e2e.test";

export const USUARIO = { nome: "Ryan Silva", email: "ryan@email.com", senha: "senha-correta" };

export function tokenDe(email: string, nome: string) {
  const parte = (dados: object) => Buffer.from(JSON.stringify(dados)).toString("base64url");
  return `${parte({ alg: "HS256" })}.${parte({ sub: email, nome, exp: 4102444800 })}.assinatura`;
}

type RespostaLogin = { status: number; corpo?: object; headers?: Record<string, string> };

export async function mockarApi(page: Page, respostaLogin: (email: string, senha: string) => RespostaLogin) {
  const json = (route: Route, status: number, corpo: unknown, headers: Record<string, string> = {}) =>
    route.fulfill({
      status,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Expose-Headers": "Retry-After", ...headers },
      body: corpo === undefined ? "" : JSON.stringify(corpo),
    });

  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.fulfill({ status: 200, body: "" }));

  await page.route(`${API}/**`, async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") {
      return route.fulfill({
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Authorization, Content-Type",
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE",
        },
      });
    }

    const caminho = new URL(request.url()).pathname;
    if (caminho === "/auth/login") {
      const { email, senha } = request.postDataJSON();
      const resposta = respostaLogin(email, senha);
      return json(route, resposta.status, resposta.corpo, resposta.headers);
    }
    if (caminho === "/boletos/dashboard") {
      return json(route, 200, { totalAtrasados: 0, totalAVencer: 0, somaEmAberto: 0, somaPagaNoMes: 0 });
    }
    if (caminho === "/usuarios/eu") {
      return json(route, 200, {
        id: "u1", nome: USUARIO.nome, email: USUARIO.email, temFoto: false,
        diasAviso: 7, avisoVencimentoAtivo: true, resumoSemanalAtivo: false, emailPendente: null,
      });
    }
    if (caminho === "/grupos/meu") {
      return json(route, 200, "");
    }
    if (request.method() === "GET") {
      return json(route, 200, []);
    }
    return json(route, 404, { message: `Sem mock para ${request.method()} ${caminho}` });
  });
}

export function loginPadrao(email: string, senha: string): RespostaLogin {
  return email === USUARIO.email && senha === USUARIO.senha
    ? { status: 200, corpo: { token: tokenDe(USUARIO.email, USUARIO.nome) } }
    : { status: 401, corpo: { message: "Credenciais inválidas" } };
}
