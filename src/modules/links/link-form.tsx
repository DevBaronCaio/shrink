"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  applyUtm,
  utmNames,
  utmSchema,
  webUrl,
  type Utm,
} from "@/modules/campaigns/utm";
import { saveLinkAction } from "./actions";
import type { ManagedLink } from "./service";

const formSchema = z.object({
  title: z.string().trim().min(1, "Informe um título.").max(120),
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
  slug: z
    .string()
    .trim()
    .max(48)
    .refine(
      (value) => !value || /^[a-z0-9][a-z0-9_-]{1,46}[a-z0-9]$/i.test(value),
      "Use de 3 a 48 letras, números, hífens ou sublinhados.",
    ),
  description: z.string().trim().max(500),
  expiresAt: z
    .string()
    .refine(
      (value) => !value || Number.isFinite(new Date(value).getTime()),
      "Informe uma data válida.",
    ),
  clickLimit: z
    .string()
    .refine(
      (value) =>
        !value || (/^[1-9]\d*$/.test(value) && Number(value) <= 2147483647),
      "Informe um número inteiro entre 1 e 2.147.483.647.",
    ),
  tags: z.string().refine((value) => {
    const names = value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    return names.length <= 8 && names.every((name) => name.length <= 32);
  }, "Use até oito tags de 32 caracteres."),
  isActive: z.boolean(),
  utm: utmSchema,
});
type Fields = z.input<typeof formSchema>;

function clockField(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 16);
}

export function LinkForm({
  link,
  destination = "",
  initialUtm,
}: {
  link?: ManagedLink;
  destination?: string;
  initialUtm?: Utm;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    resetField,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<Fields>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: link?.title ?? "",
      destinationUrl: link?.destinationUrl ?? destination,
      slug: link?.slug ?? "",
      description: link?.description ?? "",
      expiresAt: "",
      clickLimit: link?.clickLimit?.toString() ?? "",
      tags: link?.tags.map(({ name }) => name).join(", ") ?? "",
      isActive: link?.isActive ?? true,
      utm: link?.utm ?? initialUtm ?? {},
    },
  });
  const expiry = link?.expiresAt;
  useEffect(() => {
    if (expiry) resetField("expiresAt", { defaultValue: clockField(expiry) });
  }, [expiry, resetField]);

  async function submit(values: Fields) {
    const utm = Object.fromEntries(
      Object.entries(values.utm).filter(([, value]) => Boolean(value)),
    );
    let source = values.destinationUrl;
    if (link?.utm && !dirtyFields.destinationUrl) {
      const url = new URL(source);
      for (const [name, old] of Object.entries(link.utm)) {
        if (url.searchParams.get(name) === old) url.searchParams.delete(name);
      }
      source = url.href;
    }
    const result = await saveLinkAction(link?.id ?? null, {
      ...values,
      destinationUrl: applyUtm(source),
      description: values.description || null,
      slug: values.slug || undefined,
      expiresAt:
        link && !dirtyFields.expiresAt
          ? undefined
          : values.expiresAt
            ? new Date(values.expiresAt).toISOString()
            : null,
      clickLimit: values.clickLimit ? Number(values.clickLimit) : null,
      tags: values.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      utm: Object.keys(utm).length ? utm : null,
    });
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(link ? "Link atualizado." : "Link criado.");
    router.push("/dashboard/links");
  }

  return (
    <form
      className="panel editor-form"
      onSubmit={handleSubmit(submit)}
      noValidate
    >
      <div className="field">
        <label htmlFor="link-title">Título</label>
        <Input
          id="link-title"
          placeholder="Ex.: Guia de integração"
          maxLength={120}
          aria-invalid={Boolean(errors.title)}
          {...register("title")}
        />
        {errors.title && (
          <span className="error" role="alert">
            {errors.title.message}
          </span>
        )}
      </div>
      <div className="field">
        <label htmlFor="link-destination">URL de destino</label>
        <Input
          id="link-destination"
          type="url"
          placeholder="https://example.com/guia"
          maxLength={2048}
          aria-invalid={Boolean(errors.destinationUrl)}
          {...register("destinationUrl")}
        />
        {errors.destinationUrl && (
          <span className="error" role="alert">
            {errors.destinationUrl.message}
          </span>
        )}
      </div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="link-slug">Slug personalizado</label>
          <Input
            id="link-slug"
            placeholder="Gerado automaticamente"
            {...register("slug")}
          />
          {errors.slug && (
            <span className="error" role="alert">
              {errors.slug.message}
            </span>
          )}
        </div>
        <div className="field">
          <label htmlFor="link-tags">Tags</label>
          <Input
            id="link-tags"
            placeholder="produto, lançamento"
            {...register("tags")}
          />
          {errors.tags ? (
            <span className="error" role="alert">
              {errors.tags.message}
            </span>
          ) : (
            <span className="helper">Separe as tags por vírgula.</span>
          )}
        </div>
        <div className="field">
          <label htmlFor="link-expiry">Expiração</label>
          <Input
            id="link-expiry"
            type="datetime-local"
            {...register("expiresAt")}
          />
          {errors.expiresAt ? (
            <span className="error" role="alert">
              {errors.expiresAt.message}
            </span>
          ) : (
            <span className="helper">Horário local do dispositivo.</span>
          )}
        </div>
        <div className="field">
          <label htmlFor="link-limit">Limite de cliques</label>
          <Input
            id="link-limit"
            inputMode="numeric"
            placeholder="Sem limite"
            {...register("clickLimit")}
          />
          {errors.clickLimit && (
            <span className="error" role="alert">
              {errors.clickLimit.message}
            </span>
          )}
        </div>
      </div>
      <div className="field">
        <label htmlFor="link-description">Descrição</label>
        <textarea
          id="link-description"
          className="input"
          placeholder="Observações sobre este link"
          maxLength={500}
          {...register("description")}
        />
      </div>
      <label className="check-field">
        <input type="checkbox" {...register("isActive")} /> Link ativo
      </label>
      <details className="utm-details" open={Boolean(initialUtm) || undefined}>
        <summary>Parâmetros UTM</summary>
        <div className="form-grid">
          {utmNames.map((name) => (
            <div key={name} className="field">
              <label htmlFor={name}>{name}</label>
              <Input id={name} maxLength={200} {...register(`utm.${name}`)} />
            </div>
          ))}
        </div>
      </details>
      <div className="page-actions">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Salvando…"
            : link
              ? "Salvar alterações"
              : "Criar link"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/links")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
