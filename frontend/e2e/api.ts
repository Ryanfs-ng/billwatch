import type { Page, Route } from "@playwright/test";

export const API = "http://api.e2e.test";

export const USUARIO = { id: "u1", nome: "Ryan Silva", email: "ryan@email.com", senha: "senha-correta" };
const MARTA = { id: "u2", nome: "Marta Silva", email: "marta@email.com" };

export const HOJE = "2026-11-04";
export const AGORA = new Date(`${HOJE}T12:00:00-03:00`);

export function tokenDe(email: string, nome: string) {
  const parte = (dados: object) => Buffer.from(JSON.stringify(dados)).toString("base64url");
  return `${parte({ alg: "HS256" })}.${parte({ sub: email, nome, exp: 4102444800 })}.assinatura`;
}

export async function entrarLogado(page: Page) {
  await page.addInitScript((token) => localStorage.setItem("billwatch_token", token), tokenDe(USUARIO.email, USUARIO.nome));
}

type RespostaLogin ={ status: number; corpo?: object; headers?: Record<string, string> };

export interface BoletoFalso {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataPagamento: string | null;
  responsavelId: string;
  recorrente: boolean;
}

export function boleto(id: string, descricao: string, valor: number, dataVencimento: string, pago = false): BoletoFalso {
  return { id, descricao, valor, dataVencimento, dataPagamento: pago ? dataVencimento : null, responsavelId: USUARIO.id, recorrente: false };
}

function somarDias(iso: string, dias: number) {
  const data = new Date(`${iso}T12:00:00Z`);
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

function status(b: BoletoFalso) {
  if (b.dataPagamento) return "PAGO";
  if (b.dataVencimento < HOJE) return "ATRASADO";
  if (b.dataVencimento <= somarDias(HOJE, 7)) return "A_VENCER";
  return "PENDENTE";
}

function resposta(b: BoletoFalso) {
  const responsavel = b.responsavelId === MARTA.id ? MARTA : USUARIO;
  return {
    ...b,
    dataAnexado: `${HOJE}T12:00:00Z`,
    anexo: null,
    responsavelNome: responsavel.nome,
    status: status(b),
    proximoGerado: false,
  };
}

interface Opcoes {
  login?: (email: string, senha: string) => RespostaLogin;
  boletos?: BoletoFalso[];
}

export function loginPadrao(email: string, senha: string): RespostaLogin {
  return email === USUARIO.email && senha === USUARIO.senha
    ? { status: 200, corpo: { token: tokenDe(USUARIO.email, USUARIO.nome) } }
    : { status: 401, corpo: { message: "Credenciais inválidas" } };
}

export async function mockarApi(page: Page, opcoes: Opcoes = {}) {
  const login = opcoes.login ?? loginPadrao;
  const boletos = [...(opcoes.boletos ?? [])];
  const chamadas: { metodo: string; caminho: string; corpo: unknown }[] = [];
  let proximoId = 1000;

  const json = (route: Route, statusHttp: number, corpo?: unknown, headers: Record<string, string> = {}) =>
    route.fulfill({
      status: statusHttp,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Expose-Headers": "Retry-After", ...headers },
      body: corpo === undefined ? "" : JSON.stringify(corpo),
    });

  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.fulfill({ status: 200, body: "" }));

  await page.route(`${API}/**`, async (route) => {
    const request = route.request();
    const metodo = request.method();
    if (metodo === "OPTIONS") {
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
    const corpo = request.postData() ? request.postDataJSON() : undefined;
    chamadas.push({ metodo, caminho, corpo });
    const rota = `${metodo} ${caminho}`;
    const idDoBoleto = caminho.match(/^\/boletos\/([^/]+)/)?.[1];
    const existente = boletos.find((b) => b.id === idDoBoleto);

    if (rota === "POST /auth/login") {
      const r = login(corpo.email, corpo.senha);
      return json(route, r.status, r.corpo, r.headers);
    }
    if (rota === "POST /auth/registrar") {
      return corpo.email === USUARIO.email ? json(route, 409, { message: "Email já cadastrado" }) : json(route, 202);
    }
    if (rota === "POST /auth/confirmar-email") {
      return corpo.token === "token-valido"
        ? json(route, 200, { token: tokenDe("nova@email.com", "Nova Pessoa") })
        : json(route, 400, { message: "Link de confirmação inválido ou expirado" });
    }
    if (rota === "GET /usuarios/eu") {
      return json(route, 200, {
        id: USUARIO.id, nome: USUARIO.nome, email: USUARIO.email, temFoto: false,
        diasAviso: 7, avisoVencimentoAtivo: true, resumoSemanalAtivo: false, emailPendente: null,
      });
    }
    if (rota === "GET /usuarios") return json(route, 200, [USUARIO, MARTA].map(({ id, nome, email }) => ({ id, nome, email })));
    if (rota === "GET /grupos/meu") return json(route, 200, "");
    if (rota === "GET /boletos/dashboard") {
      return json(route, 200, { totalAtrasados: 0, totalAVencer: 0, somaEmAberto: 0, somaPagaNoMes: 0 });
    }
    if (rota === "GET /boletos/meus-boletos") {
      return json(route, 200, boletos.filter((b) => b.responsavelId === USUARIO.id).map(resposta));
    }
    if (rota === "GET /boletos") return json(route, 200, boletos.map(resposta));
    if (rota === "POST /boletos") {
      const novo: BoletoFalso = {
        id: String(proximoId++),
        descricao: corpo.descricao,
        valor: corpo.valor,
        dataVencimento: corpo.dataVencimento,
        dataPagamento: null,
        responsavelId: corpo.responsavelId ?? USUARIO.id,
        recorrente: !!corpo.recorrente,
      };
      boletos.push(novo);
      return json(route, 201, resposta(novo));
    }
    if (existente && metodo === "PUT" && caminho === `/boletos/${existente.id}`) {
      Object.assign(existente, {
        descricao: corpo.descricao,
        valor: corpo.valor,
        dataVencimento: corpo.dataVencimento,
        responsavelId: corpo.responsavelId ?? existente.responsavelId,
        recorrente: !!corpo.recorrente,
      });
      return json(route, 200, resposta(existente));
    }
    if (existente && rota === `PATCH /boletos/${existente.id}/pagar`) {
      existente.dataPagamento = HOJE;
      return json(route, 200, resposta(existente));
    }
    if (existente && rota === `DELETE /boletos/${existente.id}`) {
      boletos.splice(boletos.indexOf(existente), 1);
      return route.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
    }
    if (metodo === "GET") return json(route, 200, []);
    return json(route, 404, { message: `Sem mock para ${rota}` });
  });

  return { boletos, chamadas };
}
