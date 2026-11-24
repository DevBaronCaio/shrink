import { describe, expect, it } from "vitest";
import {
  analyticsWindow,
  localDate,
  validTimezone,
  variation,
} from "@/modules/analytics/period";
import { qrSchema, defaultQr } from "@/modules/qr-codes/settings";

describe("períodos e indicadores", () => {
  it("usa o dia local e subtrai dias de calendário", () => {
    const now = new Date("2026-03-09T01:00:00Z");
    const timezone = "America/New_York";
    expect(localDate(now, timezone)).toBe("2026-03-08");
    expect(analyticsWindow({ period: "7d" }, timezone, now)).toMatchObject({
      from: "2026-03-02",
      to: "2026-03-08",
      previousFrom: "2026-02-23",
      end: "2026-03-09",
      length: 7,
    });
    expect(validTimezone(timezone)).toBe(true);
    expect(validTimezone("abracadabra")).toBe(false);
  });

  it("rejeita datas futuras, invertidas ou fora da política de retenção", () => {
    const now = new Date("2026-11-23T12:00:00Z");
    expect(() =>
      analyticsWindow(
        { period: "custom", from: "2026-11-24", to: "2026-11-24" },
        "UTC",
        now,
      ),
    ).toThrow();
    expect(() =>
      analyticsWindow(
        { period: "custom", from: "2026-11-22", to: "2026-11-20" },
        "UTC",
        now,
      ),
    ).toThrow();
    expect(() =>
      analyticsWindow(
        { period: "custom", from: "2026-01-01", to: "2026-01-01" },
        "UTC",
        now,
      ),
    ).toThrow();
    expect(() =>
      analyticsWindow({ period: "custom", from: "2026-11-22" }, "UTC", now),
    ).toThrow();
  });

  it("calcula variação com arredondamento, preservando ausência de base", () => {
    expect(variation(20, 10)).toBe(100);
    expect(variation(0, 10)).toBe(-100);
    expect(variation(2, 3)).toBe(-33.3);
    expect(variation(11, 0)).toBeNull();
    expect(variation(11, null)).toBeNull();
  });

  it("aceita QR padrão e rejeita opções com baixo contraste ou tamanho indevido", () => {
    expect(qrSchema.safeParse(defaultQr).success).toBe(true);
    expect(
      qrSchema.safeParse({ ...defaultQr, foreground: "#eeeeee" }).success,
    ).toBe(false);
    expect(qrSchema.safeParse({ ...defaultQr, size: 9999 }).success).toBe(
      false,
    );
  });
});
