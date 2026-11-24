"use client";

import { useEffect, useState, useTransition } from "react";
import QRCode from "qrcode";
import { ClipboardCopy, Download, QrCode, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveQr } from "./actions";
import { defaultQr, qrOptions, qrSchema, type QrSettings } from "./settings";

function download(url: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
}

export function QrEditor({
  id,
  slug,
  url,
  initial,
  demo = false,
}: {
  id: string;
  slug: string;
  url: string;
  initial?: QrSettings;
  demo?: boolean;
}) {
  const [settings, setSettings] = useState(initial ?? defaultQr);
  const [image, setImage] = useState<{ settings: QrSettings; data: string }>();
  const [failed, setFailed] = useState<QrSettings>();
  const [pending, start] = useTransition();
  const validation = qrSchema.safeParse(settings);
  const preview = image?.settings === settings ? image.data : undefined;

  useEffect(() => {
    if (!qrSchema.safeParse(settings).success) return;
    let active = true;
    QRCode.toDataURL(url, qrOptions(settings))
      .then((data) => {
        if (active) setImage({ settings, data });
      })
      .catch(() => {
        if (active) setFailed(settings);
      });
    return () => {
      active = false;
    };
  }, [settings, url]);

  function save() {
    start(async () => {
      const response = await saveQr(id, settings);
      if (response.ok) toast.success("QR Code salvo no histórico.");
      else toast.error(response.message);
    });
  }

  async function svg() {
    try {
      const data = await QRCode.toString(url, {
        ...qrOptions(settings),
        type: "svg",
      });
      download(
        "data:image/svg+xml;charset=utf-8," + encodeURIComponent(data),
        `shrink-${slug}.svg`,
      );
    } catch {
      toast.error("Não foi possível baixar o SVG.");
    }
  }

  async function copy() {
    if (!preview) return;
    try {
      const imageBlob = fetch(preview).then((res) => res.blob());
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": imageBlob }),
      ]);
      toast.success("Imagem copiada.");
    } catch {
      toast.error("A cópia de imagem está indisponível. Baixe o arquivo PNG.");
    }
  }

  return (
    <div className="qr-layout">
      <section className="panel qr-preview">
        <h2>Prévia</h2>
        <div className="qr-frame">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- A imagem é um PNG gerado localmente e usado para download e cópia.
            <img
              src={preview}
              alt="QR Code para o link encurtado"
              width={256}
              height={256}
            />
          ) : (
            <div role="status">
              <QrCode size={32} />
              <p>
                {!validation.success
                  ? "Ajuste as cores para gerar a prévia."
                  : failed === settings
                    ? "Falha ao gerar a imagem."
                    : "Gerando prévia…"}
              </p>
            </div>
          )}
        </div>
        <code className="helper">{url}</code>
      </section>
      <section className="panel stack qr-controls">
        <h2>Personalizar QR Code</h2>
        <div className="form-grid">
          <label className="color-field">
            Primeiro plano
            <input
              type="color"
              value={settings.foreground}
              onChange={(event) =>
                setSettings({ ...settings, foreground: event.target.value })
              }
            />
            <code>{settings.foreground}</code>
          </label>
          <label className="color-field">
            Fundo
            <input
              type="color"
              value={settings.background}
              onChange={(event) =>
                setSettings({ ...settings, background: event.target.value })
              }
            />
            <code>{settings.background}</code>
          </label>
        </div>
        <div className="field">
          <label htmlFor="qr-size">Tamanho do arquivo</label>
          <select
            id="qr-size"
            className="input"
            value={settings.size}
            onChange={(event) => {
              const size = Number(event.target.value) as QrSettings["size"];
              setSettings({ ...settings, size });
            }}
          >
            {[128, 256, 512, 1024].map((size) => (
              <option key={size} value={size}>
                {size} × {size} px
              </option>
            ))}
          </select>
        </div>
        {!validation.success && (
          <p className="error" role="alert">
            {validation.error.issues[0]?.message}
          </p>
        )}
        <div className="page-actions">
          {!demo && (
            <Button disabled={!preview || pending} onClick={save}>
              <Save size={16} /> {pending ? "Salvando…" : "Salvar QR Code"}
            </Button>
          )}
          <Button
            variant="outline"
            disabled={!preview}
            onClick={() => preview && download(preview, `shrink-${slug}.png`)}
          >
            <Download size={16} /> PNG
          </Button>
          <Button
            variant="outline"
            disabled={!preview}
            onClick={() => void svg()}
          >
            <Download size={16} /> SVG
          </Button>
          <Button
            variant="outline"
            disabled={!preview}
            onClick={() => void copy()}
          >
            <ClipboardCopy size={16} /> Copiar imagem
          </Button>
        </div>
        <p className="helper">
          A imagem aponta para o link encurtado. Os acessos entram no total do
          link.
        </p>
      </section>
    </div>
  );
}
