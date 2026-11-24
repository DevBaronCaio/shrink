import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

test("demonstração pública funciona em viewport mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/demo");
  await expect(page.getByText("Demonstração pública.")).toBeVisible();
  expect(
    await page
      .locator("body")
      .evaluate((body) => body.scrollWidth <= innerWidth),
  ).toBe(true);
  await page.getByRole("link", { name: "Analytics", exact: true }).click();
  await page.getByLabel("Período").selectOption("7d");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(page).toHaveURL(/period=7d/);
  await page.getByRole("link", { name: "Links", exact: true }).click();
  await expect(page.getByRole("table")).toBeVisible();
  await page
    .getByRole("link", { name: "QR Code de Guia de integração" })
    .click();
  await expect(
    page.getByRole("img", { name: "QR Code para o link encurtado" }),
  ).toBeVisible();
});

test("a landing mostra prévia antes de pedir autenticação", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("URL de destino").fill("https://example.org/artigo");
  await page.getByRole("button", { name: "Encurtar link" }).click();
  await expect(page.getByText("Prévia", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Entrar e criar" }).click();
  await expect(page).toHaveURL(/\/entrar\?destino=/);
});

test("captura evidências reais do app quando solicitado", async ({ page }) => {
  test.skip(process.env.SHRINK_CAPTURE !== "1", "Capturas opcionais.");
  await mkdir("docs/screenshots", { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto("/");
  await page.getByRole("heading", { name: /Links menores/ }).waitFor();
  await page.screenshot({
    path: "docs/screenshots/landing.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.goto("/demo?aba=analytics");
  await page
    .getByRole("region", { name: "Gráfico de cliques" })
    .locator("svg")
    .first()
    .waitFor();
  await page.screenshot({
    path: "docs/screenshots/demo-analytics.png",
    fullPage: true,
    animations: "disabled",
  });
});
