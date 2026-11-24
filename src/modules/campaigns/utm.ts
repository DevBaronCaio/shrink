import { z } from "zod";

export const utmNames = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;
export const utmSchema = z.strictObject(
  Object.fromEntries(
    utmNames.map((name) => [
      name,
      z.string().trim().max(200, "Use até 200 caracteres.").optional(),
    ]),
  ) as Record<(typeof utmNames)[number], z.ZodOptional<z.ZodString>>,
);
export type Utm = z.infer<typeof utmSchema>;

export function webUrl(value: string) {
  const url = new URL(value.trim());
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new Error("Use uma URL HTTP ou HTTPS sem credenciais.");
  }
  return url;
}

export function applyUtm(destination: string, parameters?: Utm | null) {
  const url = webUrl(destination);
  for (const name of utmNames) {
    const value = parameters?.[name]?.trim();
    if (value) url.searchParams.set(name, value);
  }
  return url.href;
}
