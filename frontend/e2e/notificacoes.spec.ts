import { expect, test } from "@playwright/test";
import { AGORA, boleto, entrarLogado, mockarApi } from "./api";

test.use({ reducedMotion: "reduce" });

test("marcar como lidas zera o contador e sobrevive ao recarregar", async ({ page }) => {
  await page.clock.setFixedTime(AGORA);
  await mockarApi(page, {
    boletos: [boleto("1", "Conta de luz", 183.9, "2026-10-20"), boleto("2", "Internet", 129.9, "2026-11-08")],
  });
  await entrarLogado(page);
  await page.goto("/dashboard");

  const sino = page.getByRole("button", { name: /^Notificações/ });
  await expect(sino).toHaveAccessibleName("Notificações: 2 não lidas");

  await sino.click();
  await page.getByRole("button", { name: "Marcar como lidas" }).click();
  await expect(page.getByRole("button", { name: "Marcar como lidas" })).toBeHidden();
  await expect(page.getByRole("dialog").getByText("Conta de luz")).toBeVisible();
  await expect(sino).toHaveAccessibleName("Notificações");

  await page.reload();
  await expect(page.getByRole("button", { name: /^Notificações/ })).toHaveAccessibleName("Notificações");
});
