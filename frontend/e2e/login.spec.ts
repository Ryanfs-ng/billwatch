import { expect, test, type Page } from "@playwright/test";
import { loginPadrao, mockarApi, USUARIO } from "./api";

async function entrar(page: Page, email: string, senha: string) {
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(senha);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
}

const token = (page: Page) => page.evaluate(() => localStorage.getItem("billwatch_token"));

test.describe("login", () => {
  test.beforeEach(async ({ page }) => {
    await mockarApi(page, loginPadrao);
    await page.goto("/login");
  });

  test("entra com e-mail e senha e vai para o dashboard", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Bem-vindo de volta" })).toBeVisible();

    await entrar(page, USUARIO.email, USUARIO.senha);

    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByRole("heading", { name: "Olá, Ryan" })).toBeVisible();
    expect(await token(page)).toBeTruthy();
  });

  test("senha errada mostra o erro e continua no login", async ({ page }) => {
    await entrar(page, USUARIO.email, "senha-errada");

    await expect(page.getByText("E-mail ou senha inválidos.")).toBeVisible();
    await expect(page).toHaveURL("/login");
    expect(await token(page)).toBeNull();
  });

  test("campos obrigatórios impedem o envio", async ({ page }) => {
    let tentouLogar = false;
    page.on("request", (request) => {
      if (request.url().endsWith("/auth/login") && request.method() === "POST") tentouLogar = true;
    });

    await page.getByRole("button", { name: "Entrar", exact: true }).click();

    await expect(page.getByLabel("E-mail")).toBeFocused();
    expect(tentouLogar).toBe(false);
  });

  test("sai da conta e volta para o login", async ({ page }) => {
    await entrar(page, USUARIO.email, USUARIO.senha);
    await expect(page).toHaveURL("/dashboard");

    await page.getByRole("button", { name: "Sair" }).click();

    await expect(page).toHaveURL("/login");
    expect(await token(page)).toBeNull();
  });

  test("logado, abrir o login leva direto ao dashboard", async ({ page }) => {
    await entrar(page, USUARIO.email, USUARIO.senha);
    await expect(page).toHaveURL("/dashboard");

    await page.goto("/login");

    await expect(page).toHaveURL("/dashboard");
  });
});

test.describe("login com respostas especiais da API", () => {
  test("conta que ainda não confirmou o e-mail", async ({ page }) => {
    await mockarApi(page, () => ({ status: 403, corpo: { message: "Confirme seu e-mail" } }));
    await page.goto("/login");

    await entrar(page, USUARIO.email, USUARIO.senha);

    await expect(page.getByText("Confirme seu e-mail pelo link que enviamos para ativar a conta.")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("muitas tentativas informa quanto tempo esperar", async ({ page }) => {
    await mockarApi(page, () => ({ status: 429, headers: { "Retry-After": "120" } }));
    await page.goto("/login");

    await entrar(page, USUARIO.email, "senha-errada");

    await expect(page.getByText("Muitas tentativas. Tente novamente em 2 minutos.")).toBeVisible();
  });
});

test.describe("rotas protegidas", () => {
  test("sem login, páginas internas redirecionam para o login", async ({ page }) => {
    await mockarApi(page, loginPadrao);

    for (const rota of ["/dashboard", "/boletos", "/configuracoes"]) {
      await page.goto(rota);
      await expect(page).toHaveURL("/login");
    }
  });

  test("rota inexistente vai para o login", async ({ page }) => {
    await mockarApi(page, loginPadrao);
    await page.goto("/pagina-que-nao-existe");
    await expect(page).toHaveURL("/login");
  });
});
