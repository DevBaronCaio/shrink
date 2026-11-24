export const site = {
  name: "Shrink",
  description:
    "Encurte, gerencie e acompanhe o desempenho dos seus links em uma única plataforma.",
  github:
    process.env.NEXT_PUBLIC_GITHUB_URL ||
    "https://github.com/search?q=shrink+url+shortener&type=repositories",
};

export function appUrl() {
  const deployment = process.env.VERCEL_URL;
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL || deployment;
  const origin =
    process.env.VERCEL_ENV === "preview" && deployment
      ? `https://${deployment}`
      : process.env.NEXT_PUBLIC_APP_URL ||
        (production ? `https://${production}` : "http://localhost:3000");
  const url = new URL(origin);
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    (process.env.VERCEL === "1" && url.protocol !== "https:")
  )
    throw new Error("Origem pública inválida.");
  return url.origin;
}

export function shortUrl(slug: string) {
  return `${appUrl()}/r/${encodeURIComponent(slug)}`;
}
