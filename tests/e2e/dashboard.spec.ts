import { test, expect } from "./fixtures";

test("protege páginas privadas sem sessão", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/entrar$/);
  await expect(
    page.getByRole("heading", { name: "Entre no Shrink" }),
  ).toBeVisible();
});

test("cria, edita, redireciona, filtra analytics e gera QR", async ({
  page,
  request,
  signedIn,
}, info) => {
  expect(signedIn).toBe(true);
  const slug = `e2e-guia-${info.retry}-${Date.now()}`;
  await page.goto("/dashboard/links/novo");
  await page.getByLabel("Título").fill("Guia para teste");
  await page.getByLabel("URL de destino").fill("https://example.org/guia");
  await page.getByLabel("Slug personalizado").fill(slug);
  await page.getByLabel("Tags").fill("docs, e2e");
  await page.getByRole("button", { name: "Criar link", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/links\/[^/?]+$/);
  await expect(
    page.getByRole("link", { name: new RegExp(`/r/${slug}$`) }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Copiar link" })).toBeVisible();
  await page.getByRole("link", { name: "Voltar para links" }).click();
  const row = page.getByRole("row").filter({ hasText: "Guia para teste" });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Ações de Guia para teste" }).click();
  await page.getByRole("menuitem", { name: "Editar" }).click();
  await page.getByLabel("URL de destino").fill("https://example.org/guia-novo");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page).toHaveURL(/\/dashboard\/links$/);
  const redirected = await request.get(`/r/${slug}`, { maxRedirects: 0 });
  expect(redirected.status()).toBe(302);
  expect(redirected.headers().location).toBe("https://example.org/guia-novo");
  await page.getByLabel("Buscar", { exact: true }).fill("Guia para");
  await expect(page).toHaveURL(/q=Guia\+para/);
  await row.getByRole("link", { name: "Guia para teste" }).click();
  await expect(
    page.getByRole("heading", { name: "Cliques ao longo do tempo" }),
  ).toBeVisible();
  await page.getByLabel("Período").selectOption("7d");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(page).toHaveURL(/period=7d/);
  await page.getByRole("link", { name: "QR Code", exact: true }).click();
  await expect(
    page.getByRole("img", { name: "QR Code para o link encurtado" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Salvar QR Code" }).click();
  await expect(
    page.getByRole("link", { name: /Guia para teste/ }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "PNG", exact: true }).click();
  expect((await download).suggestedFilename()).toBe(`shrink-${slug}.png`);
});

test("cria e revoga chave de API por interface", async ({
  page,
  request,
  signedIn,
}) => {
  expect(signedIn).toBe(true);
  await page.goto("/dashboard/developers");
  await page.getByLabel("Nome da chave").fill("Chave do teste");
  await page.getByRole("button", { name: "Criar chave" }).click();
  const credential = page.locator("code.url-preview");
  await expect(credential).toHaveText(/^sk_shrink_/);
  const token = await credential.innerText();
  const headers = { Authorization: `Bearer ${token}` };
  expect((await request.get("/api/v1/links", { headers })).status()).toBe(200);
  await page.getByRole("button", { name: "Revogar", exact: true }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Revogar chave" })
    .click();
  await expect(page.getByRole("cell", { name: "Revogada" })).toBeVisible();
  expect((await request.get("/api/v1/links", { headers })).status()).toBe(401);
});
