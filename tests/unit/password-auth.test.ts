import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/modules/auth/password";
import { authContinuation } from "@/modules/auth/continuation";
import {
  safeDashboardPath,
  signInSchema,
  signUpSchema,
} from "@/modules/auth/schema";

describe("password authentication", () => {
  it("hashes passwords and verifies only the original value", async () => {
    const hash = await hashPassword("uma senha longa para a conta");
    expect(hash).not.toContain("uma senha longa");
    expect(await verifyPassword("uma senha longa para a conta", hash)).toBe(
      true,
    );
    expect(await verifyPassword("outra senha longa", hash)).toBe(false);
  });

  it("normalizes e-mail and validates account fields", () => {
    const result = signUpSchema.parse({
      name: " Caio ",
      email: " CAIO@example.com ",
      password: "senha bem segura 123",
      confirmation: "senha bem segura 123",
    });
    expect(result).toMatchObject({ name: "Caio", email: "caio@example.com" });
    expect(
      signUpSchema.safeParse({ ...result, confirmation: "diferente" }).success,
    ).toBe(false);
    expect(
      signInSchema.safeParse({ email: "ruim", password: "x" }).success,
    ).toBe(false);
  });

  it("accepts only local dashboard return paths", () => {
    expect(safeDashboardPath("/dashboard/links?status=active")).toBe(
      "/dashboard/links?status=active",
    );
    expect(safeDashboardPath("//evil.example")).toBe("/dashboard");
    expect(safeDashboardPath("https://evil.example")).toBe("/dashboard");
    expect(safeDashboardPath("/dashboard-other")).toBe("/dashboard");
    expect(safeDashboardPath("/dashboard/%2e%2e/entrar")).toBe("/dashboard");
  });

  it("preserves the full destination through signup and login", () => {
    const destination = `https://example.com/p?q=${"&".repeat(900)}#fim`;
    const flow = authContinuation({ destino: destination });
    expect(new URLSearchParams(flow.query).get("destino")).toBe(destination);
    const callback = new URL(
      safeDashboardPath(flow.callback),
      "https://shrink.invalid",
    );
    expect(callback.pathname).toBe("/dashboard/links/novo");
    expect(callback.searchParams.get("destino")).toBe(destination);
  });

  it("ignores repeated and invalid destinations", () => {
    expect(
      authContinuation({
        destino: ["https://example.com", "https://example.org"],
      }).callback,
    ).toBe("/dashboard");
    expect(
      authContinuation({ destino: "https://user:secret@example.com" }).query,
    ).toBe("");
  });
});
