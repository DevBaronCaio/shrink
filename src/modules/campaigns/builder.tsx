"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/shared/copy-button";
import { applyUtm, utmNames, utmSchema, type Utm } from "./utm";

const labels = ["Origem", "Mídia", "Campanha", "Termo", "Conteúdo"];

export function UtmBuilder() {
  const [preview, setPreview] = useState<{
    source: string;
    result: string;
    utm: Utm;
  }>();
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPreview(undefined);
    const data = new FormData(event.currentTarget);
    const source = String(data.get("destination") ?? "");
    try {
      const utm = utmSchema.parse(
        Object.fromEntries(
          utmNames.map((name) => [name, String(data.get(name) ?? "")]),
        ),
      );
      const result = applyUtm(source, utm);
      if (result.length > 2048) {
        setError("A URL da campanha precisa ter até 2048 caracteres.");
        return;
      }
      setPreview({ source, result, utm });
    } catch {
      setError(
        "Informe uma URL HTTP ou HTTPS válida e parâmetros de até 200 caracteres.",
      );
    }
  }

  return (
    <div className="stack views-gap">
      <form
        className="panel editor-form"
        onSubmit={submit}
        onChange={() => {
          setPreview(undefined);
          setError("");
        }}
      >
        <div className="field">
          <label htmlFor="utm-destination">URL de destino</label>
          <Input
            id="utm-destination"
            type="url"
            name="destination"
            required
            maxLength={2048}
            placeholder="https://example.com/guia?ref=blog"
          />
        </div>
        <div className="form-grid">
          {utmNames.map((name, index) => (
            <div className="field" key={name}>
              <label htmlFor={name}>
                {labels[index]} <code className="helper">{name}</code>
              </label>
              <Input id={name} name={name} maxLength={200} />
            </div>
          ))}
        </div>
        <div className="page-actions">
          <Button type="submit">
            <Tags size={16} /> Gerar URL da campanha
          </Button>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </form>
      {preview && (
        <section className="panel editor-form" aria-live="polite">
          <h2>URL da campanha</h2>
          <code className="url-preview">{preview.result}</code>
          <div className="page-actions">
            <CopyButton value={preview.result} label="Copiar URL" />
            <Button asChild>
              <Link
                href={`/dashboard/links/novo?${new URLSearchParams({ destino: preview.source, ...preview.utm })}`}
              >
                Encurtar URL
              </Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
