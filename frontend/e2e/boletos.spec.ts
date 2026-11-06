import { expect, test, type Page } from "@playwright/test";
import { AGORA, boleto, entrarLogado, mockarApi } from "./api";

test.use({ reducedMotion: "reduce" });

const BOLETOS = [
  boleto("1", "Conta de luz", 183.9, "2026-10-20"),
  boleto("2", "Internet", 129.9, "2026-11-08"),
  boleto("3", "Aluguel", 1800, "2026-11-25"),
  boleto("4", "Condomínio", 450, "2026-10-10", true),
  boleto("5", "IPTU", 245, "2026-12-20"),
];

const descricoes = (page: Page) => page.locator("tbody tr td:first-child");
const linha = (page: Page, descricao: string) => page.getByRole("row").filter({ hasText: descricao });

async function abrir(page: Page, boletos = BOLETOS) {
  await page.clock.setFixedTime(AGORA);
  const api = await mockarApi(page, { boletos });
  await entrarLogado(page);
  await page.goto("/boletos");
  return api;
}

test.describe("ciclo de um boleto", () => {
  test("cria um boleto pelo formulário", async ({ page }) => {
    const api = await abrir(page, []);
    await expect(page.getByText("Nenhum boleto por aqui.")).toBeVisible();

    await page.getByRole("button", { name: "Novo boleto" }).first().click();
    const formulario = page.getByRole("dialog");
    await formulario.getByLabel("Descrição").fill("Academia");
    await formulario.getByLabel("Valor (R$)").fill("120");
    await formulario.getByRole("button", { name: "Vencimento" }).click();
    await page.getByRole("button", { name: /18 de novembro de 2026/ }).click();
    await expect(formulario.getByRole("button", { name: "Vencimento" })).toHaveText(/18\/11\/2026/);
    await formulario.getByRole("button", { name: "Salvar" }).click();

    await expect(page.getByText("Boleto criado.")).toBeVisible();
    const criado = linha(page, "Academia");
    await expect(criado).toContainText("R$ 120,00");
    await expect(criado).toContainText("18/11/2026");
    await expect(criado).toContainText("Pendente");
    expect(api.chamadas.find((c) => c.metodo === "POST" && c.caminho === "/boletos")?.corpo).toMatchObject({
      descricao: "Academia",
      valor: 120,
      dataVencimento: "2026-11-18",
      responsavelId: "u1",
      recorrente: false,
    });
  });

  test("edita o valor de um boleto", async ({ page }) => {
    await abrir(page);

    await linha(page, "Internet").getByRole("button", { name: "Editar" }).click();
    const formulario = page.getByRole("dialog");
    await expect(formulario.getByLabel("Descrição")).toHaveValue("Internet");
    await formulario.getByLabel("Valor (R$)").fill("149.9");
    await formulario.getByRole("button", { name: "Salvar" }).click();

    await expect(page.getByText("Boleto atualizado.")).toBeVisible();
    await expect(linha(page, "Internet")).toContainText("R$ 149,90");
  });

  test("marca um boleto atrasado como pago", async ({ page }) => {
    await abrir(page);
    const luz = linha(page, "Conta de luz");
    await expect(luz).toContainText("Atrasado");

    await luz.getByRole("button", { name: "Marcar como pago" }).click();

    await expect(page.getByText('"Conta de luz" marcado como pago.')).toBeVisible();
    await expect(luz).toContainText("Pago");
    await expect(luz.getByRole("button", { name: "Já está pago" })).toBeDisabled();
  });

  test("exclui um boleto depois de confirmar", async ({ page }) => {
    await abrir(page);

    await linha(page, "IPTU").getByRole("button", { name: "Excluir" }).click();
    const confirmacao = page.getByRole("dialog");
    await expect(confirmacao.getByRole("heading", { name: "Excluir boleto?" })).toBeVisible();
    await confirmacao.getByRole("button", { name: "Excluir" }).click();

    await expect(page.getByText("Boleto excluído.")).toBeVisible();
    await expect(linha(page, "IPTU")).toHaveCount(0);
  });

  test("cancelar a exclusão mantém o boleto", async ({ page }) => {
    await abrir(page);

    await linha(page, "IPTU").getByRole("button", { name: "Excluir" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Cancelar" }).click();

    await expect(linha(page, "IPTU")).toHaveCount(1);
  });
});

test.describe("filtros", () => {
  test("lista os em aberto primeiro e os pagos no fim", async ({ page }) => {
    await abrir(page);

    await expect(descricoes(page)).toHaveText(["Conta de luz", "Internet", "Aluguel", "IPTU", "Condomínio"]);
  });

  test("busca pela descrição sem diferenciar maiúsculas", async ({ page }) => {
    await abrir(page);

    await page.getByLabel("Buscar boleto").fill("ALUG");

    await expect(descricoes(page)).toHaveText(["Aluguel"]);
  });

  test("filtra por status", async ({ page }) => {
    await abrir(page);

    await page.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "Pago" }).click();

    await expect(descricoes(page)).toHaveText(["Condomínio"]);
  });

  test("filtra pelo período de vencimento", async ({ page }) => {
    await abrir(page);

    await page.getByRole("button", { name: "7 dias" }).click();
    await expect(descricoes(page)).toHaveText(["Internet"]);

    await page.getByRole("button", { name: "Este mês" }).click();
    await expect(descricoes(page)).toHaveText(["Internet", "Aluguel"]);
  });

  test("sem resultado, oferece limpar os filtros", async ({ page }) => {
    await abrir(page);

    await page.getByLabel("Buscar boleto").fill("não existe");
    await expect(page.getByText("Nenhum boleto corresponde aos filtros.")).toBeVisible();

    await page.getByRole("button", { name: "Limpar filtros" }).last().click();

    await expect(page.getByLabel("Buscar boleto")).toHaveValue("");
    await expect(descricoes(page)).toHaveCount(BOLETOS.length);
  });
});
