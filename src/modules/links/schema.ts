import { z } from "zod";
import { webUrl, utmSchema } from "@/modules/campaigns/utm";

const expiry = z.iso
  .datetime({ offset: true })
  .refine(
    (value) => Number.isFinite(Date.parse(value)),
    "Informe uma data válida.",
  );
export const tagNames = z
  .array(z.string().trim().toLowerCase().min(1).max(32))
  .max(8)
  .transform((names) => [...new Set(names)].sort());

const fields = z.strictObject({
  destinationUrl: z
    .string()
    .trim()
    .max(2048)
    .refine((value) => {
      try {
        webUrl(value);
        return true;
      } catch {
        return false;
      }
    }, "Informe uma URL HTTP ou HTTPS válida."),
  title: z.string().trim().min(1, "Informe um título.").max(120),
  description: z.string().trim().max(500).nullable().optional(),
  slug: z.string().trim().min(3).max(48).optional(),
  isActive: z.boolean().optional(),
  expiresAt: expiry.nullable().optional(),
  clickLimit: z.int().min(1).max(2147483647).nullable().optional(),
  tags: tagNames.optional(),
  utm: utmSchema.nullable().optional(),
});

export const createLinkSchema = fields;
export const updateLinkSchema = fields
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Informe pelo menos um campo para atualizar.",
  );
export const statusSchema = z.enum([
  "active",
  "inactive",
  "expired",
  "limited",
  "blocked",
]);
export const listLinkSchema = z
  .strictObject({
    q: z.string().trim().max(150).optional(),
    status: statusSchema.optional(),
    tag: z.string().trim().toLowerCase().max(32).optional(),
    campaign: z.string().trim().max(200).optional(),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
    sort: z.enum(["newest", "oldest", "clicks"]).default("newest"),
    page: z.coerce.number().int().min(1).max(10000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: "O início precisa anteceder o fim.",
    path: ["from"],
  });

export type ListQuery = z.infer<typeof listLinkSchema>;
export type LinkStatus = z.infer<typeof statusSchema>;

export const linkQueryKeys = [
  "q",
  "status",
  "tag",
  "campaign",
  "from",
  "to",
  "sort",
  "page",
  "limit",
] as const;
