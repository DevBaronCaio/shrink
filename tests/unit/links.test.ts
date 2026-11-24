import { describe, expect, it, vi } from "vitest";
import { randomSlug, normalizeSlug, validSlug } from "@/modules/links/slug";
import { validateDestination } from "@/modules/links/destination";
import { parseExpiry, linkStatus } from "@/modules/links/rules";
import { referrerDomain } from "@/modules/redirect/metadata";
import { applyUtm } from "@/modules/campaigns/utm";

describe("regras de links", () => {
  it("gera slugs válidos e normaliza apenas os personalizados", () => {
    for (let i = 0; i < 50; i++) {
      const slug = randomSlug();
      expect(slug).toHaveLength(8);
      expect(validSlug(slug)).toBe(true);
    }
    expect(normalizeSlug("  Minha-Campanha  ")).toBe("minha-campanha");
    for (const slug of ["api", "_abc", "abc-", "a/b", "çai", "x".repeat(49)])
      expect(validSlug(slug)).toBe(false);
  });

  it("rejeita esquemas, credenciais e destinos locais ou privados", () => {
    for (const url of [
      "javascript:alert(1)",
      "file:///etc/hosts",
      "https://a:b@example.com",
      "http://localhost",
      "http://foo.local",
      "http://127.1",
      "http://0x7f000001",
      "http://192.168.1.1",
      "http://[::ffff:10.0.0.1]",
      "http://[::1]",
    ]) {
      expect(() => validateDestination(url)).toThrow();
    }
    expect(validateDestination("https://example.com/a")).toBe(
      "https://example.com/a",
    );
  });

  it("bloqueia o próprio host e subdomínios explicitamente listados", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://shrink-example.vercel.app");
    vi.stubEnv("BLOCKED_DOMAINS", "block.example");
    try {
      expect(() =>
        validateDestination("http://shrink-example.vercel.app./r/teste"),
      ).toThrow();
      expect(() => validateDestination("https://sub.block.example/")).toThrow();
      expect(validateDestination("https://otherblock.example/")).toBe(
        "https://otherblock.example/",
      );
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("respeita expiração, estado e limite de cliques", () => {
    const now = new Date("2026-11-23T00:00:00Z");
    const link = {
      blockedAt: null,
      isActive: true,
      expiresAt: null,
      clickLimit: 2,
      clickCount: 2,
    };
    expect(linkStatus(link, now)).toBe("limited");
    expect(linkStatus({ ...link, expiresAt: now }, now)).toBe("expired");
    expect(linkStatus({ ...link, isActive: false, expiresAt: now }, now)).toBe(
      "inactive",
    );
    expect(linkStatus({ ...link, blockedAt: now }, now)).toBe("blocked");
    expect(linkStatus({ ...link, clickCount: 1 }, now)).toBe("active");
    expect(() => parseExpiry(now.toISOString(), null, now)).toThrow();
    expect(parseExpiry(now.toISOString(), now, now)).toEqual(now);
    expect(parseExpiry(null, undefined, now)).toBeNull();
  });

  it("extrai apenas o hostname e mantém ausências como null", () => {
    expect(
      referrerDomain("https://EXAMPLE.com:8080/x?token=confidencial"),
    ).toBe("example.com");
    expect(referrerDomain("https://x:y@example.com/")).toBeNull();
    expect(referrerDomain(null)).toBeNull();
    expect(referrerDomain("file:///etc/hosts")).toBeNull();
  });

  it("preserva parâmetros existentes e o fragmento ao montar UTMs", () => {
    const result = new URL(
      applyUtm("https://example.com/?ref=a&ref=b&utm_source=old#part", {
        utm_source: "boletim + social",
        utm_campaign: "setembro",
        utm_term: "",
      }),
    );
    expect(result.searchParams.getAll("ref")).toEqual(["a", "b"]);
    expect(result.searchParams.getAll("utm_source")).toEqual([
      "boletim + social",
    ]);
    expect(result.searchParams.get("utm_campaign")).toBe("setembro");
    expect(result.hash).toBe("#part");
    expect(result.searchParams.has("utm_term")).toBe(false);
  });
});
