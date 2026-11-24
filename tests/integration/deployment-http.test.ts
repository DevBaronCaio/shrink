import { expect, it } from "vitest";

const base = process.env.SHRINK_SMOKE_URL;
it.skipIf(!base)(
  "serve a landing, a demonstração isolada, a referência e o health com PostgreSQL",
  async () => {
    async function get(path: string) {
      return fetch(new URL(path, base), {
        redirect: "manual",
        signal: AbortSignal.timeout(20000),
      });
    }
    const [
      home,
      demo,
      docs,
      health,
      spec,
      missing,
      sample,
      dashboard,
      sitemap,
    ] = await Promise.all([
      get("/"),
      get("/demo?aba=analytics&period=7d"),
      get("/docs"),
      get("/api/health"),
      get("/api/v1/openapi"),
      get("/r/shrink-verificacao-improvavel"),
      get("/demo/r/guia"),
      get("/dashboard"),
      get("/sitemap.xml"),
    ]);
    expect(home.status).toBe(200);
    expect(home.headers.get("content-security-policy")).toContain(
      "'strict-dynamic'",
    );
    expect(await home.text()).toContain("Insights maiores.");
    expect(demo.status).toBe(200);
    expect(await demo.text()).toContain("Demonstração pública.");
    expect(docs.status).toBe(200);
    expect(spec.status).toBe(200);
    const origin = new URL("/", base).origin;
    expect(await spec.json()).toMatchObject({
      openapi: "3.1.0",
      servers: [{ url: origin }],
    });
    expect(sitemap.status).toBe(200);
    expect(await sitemap.text()).toContain(origin + "/demo");
    expect(health.status).toBe(200);
    expect(await health.json()).toEqual({ status: "ok" });
    expect(missing.status).toBe(404);
    expect(missing.headers.get("cache-control")).toContain("no-store");
    expect(sample.status).toBe(302);
    expect(dashboard.status).toBe(307);
    expect(dashboard.headers.get("location")).toBe("/entrar");
  },
);
