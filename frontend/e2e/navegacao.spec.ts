import { expect, test } from "@playwright/test";
import { loginPadrao, mockarApi, tokenDe, USUARIO } from "./api";

const PAGINAS = [
  { rota: "/dashboard", titulo: "Olá, Ryan", menu: "Dashboard" },
  { rota: "/boletos", titulo: "Boletos", menu: "Boletos" },
  { rota: "/calendario", titulo: "Calendário", menu: "Calendário" },
  { rota: "/grupo", titulo: "Grupo", menu: "Grupo" },
];

test.beforeEach(async ({ page }) => {
  await mockarApi(page, loginPadrao);
  await page.addInitScript((token) => localStorage.setItem("billwatch_token", token), tokenDe(USUARIO.email, USUARIO.nome));
});

for (const { rota, titulo } of PAGINAS) {
  test(`${rota} abre sem erros no console`, async ({ page }) => {
    const erros: string[] = [];
    page.on("console", (mensagem) => mensagem.type() === "error" && erros.push(mensagem.text()));
    page.on("pageerror", (erro) => erros.push(erro.message));

    await page.goto(rota);

    await expect(page.getByRole("heading", { level: 1, name: titulo })).toBeVisible();
    expect(erros).toEqual([]);
  });
}

test("o menu lateral navega entre as páginas", async ({ page }) => {
  await page.goto("/dashboard");
  const menu = page.getByRole("navigation", { name: "Principal" });

  for (const { rota, titulo, menu: item } of PAGINAS.toReversed()) {
    await menu.getByRole("link", { name: item }).click();
    await expect(page).toHaveURL(rota);
    await expect(page.getByRole("heading", { level: 1, name: titulo })).toBeVisible();
  }
});

test("configurações mostra os dados do perfil", async ({ page }) => {
  await page.goto("/configuracoes");

  await expect(page.getByRole("heading", { level: 1, name: "Configurações" })).toBeVisible();
  await expect(page.getByText(`Você entra no BillWatch com ${USUARIO.email}.`)).toBeVisible();
});
