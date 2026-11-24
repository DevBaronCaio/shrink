import { z } from "zod";

function luminance(color: string) {
  const channels = color.slice(1).match(/.{2}/g) ?? [];
  return channels.reduce((sum, digits, index) => {
    const value = parseInt(digits, 16) / 255;
    const linear =
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    return sum + linear * [0.2126, 0.7152, 0.0722][index];
  }, 0);
}

const hex = z.string().regex(/^#[a-f0-9]{6}$/i);
export const qrSchema = z
  .strictObject({
    foreground: hex,
    background: hex,
    size: z.union([
      z.literal(128),
      z.literal(256),
      z.literal(512),
      z.literal(1024),
    ]),
  })
  .refine(
    ({ foreground, background }) =>
      (luminance(background) + 0.05) / (luminance(foreground) + 0.05) >= 4.5,
    {
      message:
        "Use um primeiro plano escuro e um fundo claro com contraste de pelo menos 4,5:1.",
    },
  );
export type QrSettings = z.infer<typeof qrSchema>;
export const defaultQr: QrSettings = {
  foreground: "#111113",
  background: "#ffffff",
  size: 256,
};

export function qrOptions(settings: QrSettings) {
  return {
    width: settings.size,
    margin: 4,
    errorCorrectionLevel: "M" as const,
    color: { dark: settings.foreground, light: settings.background },
  };
}
