import { resolveRedirect } from "@/modules/redirect/service";
import { requestContext } from "@/lib/observability";
import { validSlug } from "@/modules/links/slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const reasons = {
  missing: [
    404,
    "Link não encontrado",
    "Confira o endereço e tente novamente.",
  ],
  inactive: [410, "Link desativado", "O proprietário desativou este link."],
  expired: [410, "Link expirado", "O prazo de validade deste link terminou."],
  limited: [
    410,
    "Limite de acessos atingido",
    "Este link já recebeu o número de cliques permitido.",
  ],
  blocked: [
    410,
    "Link indisponível",
    "Este endereço foi desativado pela moderação.",
  ],
  unavailable: [
    503,
    "Link temporariamente indisponível",
    "Tente novamente em alguns instantes.",
  ],
} as const;

function errorPage(
  reason: keyof typeof reasons,
  headers: HeadersInit,
  slug: string,
) {
  const [status, title, detail] = reasons[reason];
  const report =
    validSlug(slug) && reason !== "missing"
      ? `<a href="/denunciar?slug=${encodeURIComponent(slug)}">Denunciar este link</a>`
      : "";
  return new Response(
    `<!doctype html><html lang="pt-BR"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${title} · Shrink</title><style>body{color-scheme:dark;display:grid;min-height:96vh;place-items:center;background:#09090b;color:#fafafa;font:16px system-ui}
main{width:min(29rem,calc(100vw - 4rem));padding:1.5rem;background:#111113;border:1px solid #27272a;border-radius:1rem}p{color:#a1a1aa}
a{display:inline-block;color:#facc15;margin:0.5rem 1rem 0.5rem 0}b{color:#facc15}a:focus-visible{outline:2px solid #facc15;outline-offset:4px}</style>
<main><b>Shrink.</b><h1>${title}</h1><p>${detail}</p><a href="/">Ir para o início</a>${report}</main></html>`,
    {
      status,
      headers: {
        ...headers,
        "Content-Type": "text/html; charset=utf-8",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
      },
    },
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const trace = requestContext("redirect");
  const headers = {
    "Cache-Control": "private, no-store, max-age=0",
    "X-Request-Id": trace.id,
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": "noindex, nofollow",
  };
  try {
    const result = await resolveRedirect(slug, request.headers);
    if (result.status === "ok") {
      trace.log(302);
      return new Response(null, {
        status: 302,
        headers: { ...headers, Location: result.destination },
      });
    }
    trace.log(reasons[result.status][0]);
    return errorPage(result.status, headers, slug);
  } catch (error) {
    trace.log(503, error);
    return errorPage("unavailable", headers, slug);
  }
}

// Verificações HEAD não consomem a cota e não redirecionam.
export function HEAD() {
  return new Response(null, {
    status: 405,
    headers: { Allow: "GET", "Cache-Control": "no-store" },
  });
}
