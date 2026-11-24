import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/modules/auth/password";
import { safeDashboardPath, signInSchema, signUpSchema } from "@/modules/auth/schema";

describe("password authentication", () => {
  it("hashes passwords and verifies only the original value", async () => {
    const hash = await hashPassword("uma senha longa para a conta");
    expect(hash).not.toContain("uma senha longa");
    expect(await verifyPassword("uma senha longa para a conta", hash)).toBe(true);
    expect(await verifyPassword("outra senha longa", hash)).toBe(false);
  });

  it("normalizes e-mail and validates account fields", () => {
    const result = signUpSchema.parse({ name: " Caio ", email: " CAIO@example.com ", password: "senha bem segura 123", confirmation: "senha bem segura 123" });
    expect(result).toMatchObject({ name: "Caio", email: "caio@example.com" });
    expect(signUpSchema.safeParse({ ...result, confirmation: "diferente" }).success).toBe(false);
    expect(signInSchema.safeParse({ email: "ruim", password: "x" }).success).toBe(false);
  });

  it("accepts only local dashboard return paths", () => {
    expect(safeDashboardPath("/dashboard/links?status=active")).toBe("/dashboard/links?status=active");
    expect(safeDashboardPath("//evil.example")).toBe("/dashboard");
    expect(safeDashboardPath("https://evil.example")).toBe("/dashboard");
  });
});
