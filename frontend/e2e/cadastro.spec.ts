import { expect, test, type Page } from "@playwright/test";
import { mockarApi, USUARIO } from "./api";

async function preencherCadastro(page: Page, email: string, senha: string, confirmacao = senha) {
  await page.getByLabel("Nome").fill("Nova Pessoa");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(senha);
  await page.getByLabel("Confirmar senha").fill(confirmacao);
  await page.getByRole("button", { name: "Criar conta" }).click();
}

test.describe("cadastro", () => {
  test.beforeEach(async ({ page }) => {
    await mockarApi(page);
    await page.goto("/cadastro");
  });

  test("envia o link de confirmação sem criar a conta na hora", async ({ page }) => {
    await preencherCadastro(page, "nova@email.com", "senha-forte-123");

    await expect(page.getByRole("heading", { name: "Confira seu e-mail" })).toBeVisible();
    await expect(page.getByText("nova@email.com")).toBeVisible();
    await expect(page).toHaveURL("/cadastro");
    expect(await page.evaluate(() => localStorage.getItem("billwatch_token"))).toBeNull();
  });

  test("reenvia o e-mail e permite corrigir o endereço", async ({ page }) => {
    await preencherCadastro(page, "nova@email.com", "senha-forte-123");

    await page.getByRole("button", { name: "Reenviar e-mail" }).click();
    await expect(page.getByText("E-mail reenviado.")).toBeVisible();

    await page.getByRole("button", { name: "Corrigir e-mail" }).click();
    await expect(page.getByLabel("E-mail")).toHaveValue("nova@email.com");
  });

  test("senhas diferentes não chegam a ser enviadas", async ({ page }) => {
    await preencherCadastro(page, "nova@email.com", "senha-forte-123", "outra-senha-123");

    await expect(page.getByText("As senhas não coincidem.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Crie sua conta" })).toBeVisible();
  });

  test("e-mail que já tem conta mostra o erro", async ({ page }) => {
    await preencherCadastro(page, USUARIO.email, "senha-forte-123");

    await expect(page.getByText("Este e-mail já está cadastrado.")).toBeVisible();
  });
});

test.describe("confirmação de e-mail", () => {
  test.beforeEach(async ({ page }) => {
    await mockarApi(page);
  });

  test("link válido cria a conta e entra no dashboard", async ({ page }) => {
    await page.goto("/confirmar-email?token=token-valido");

    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByText("E-mail confirmado! Sua conta está pronta.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Olá, Nova" })).toBeVisible();
  });

  test("link inválido ou expirado orienta a cadastrar de novo", async ({ page }) => {
    await page.goto("/confirmar-email?token=expirado");

    await expect(page.getByRole("heading", { name: "Link inválido" })).toBeVisible();
    await expect(page.getByText(/Este link é inválido ou já expirou/)).toBeVisible();
    await page.getByRole("link", { name: "Cadastrar novamente" }).click();
    await expect(page).toHaveURL("/cadastro");
  });

  test("link sem token avisa que está incompleto", async ({ page }) => {
    await page.goto("/confirmar-email");

    await expect(page.getByText(/Este link de confirmação está incompleto/)).toBeVisible();
  });
});
