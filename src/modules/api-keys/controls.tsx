"use client";

import { useState, useTransition, type FormEvent } from "react";
import { KeyRound, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Confirm } from "@/components/shared/confirm";
import { CopyButton } from "@/components/shared/copy-button";
import { createKeyAction, revokeKeyAction } from "./actions";

export function CreateKeyForm() {
  const [pending, start] = useTransition();
  const [key, setKey] = useState<string>();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const expiry = String(data.get("expiresAt") || "");
    setKey(undefined);
    start(async () => {
      const response = await createKeyAction({
        name: data.get("name"),
        scopes: data.getAll("scope"),
        expiresAt: expiry ? new Date(expiry).toISOString() : null,
      });
      if (!response.ok) {
        toast.error(response.message);
        return;
      }
      setKey(response.data);
      form.reset();
      toast.success("Chave criada.");
    });
  }
  return (
    <section className="panel editor-form">
      <h2>Nova chave de API</h2>
      <form className="stack" onSubmit={submit}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="key-name">Nome da chave</label>
            <Input
              id="key-name"
              name="name"
              required
              minLength={2}
              maxLength={80}
              placeholder="Integração do site"
            />
          </div>
          <div className="field">
            <label htmlFor="key-expiry">Expiração opcional</label>
            <Input id="key-expiry" name="expiresAt" type="datetime-local" />
          </div>
        </div>
        <fieldset>
          <legend className="helper">Escopos</legend>
          <label className="check-field">
            <input type="checkbox" name="scope" value="READ" defaultChecked />{" "}
            Leitura de links e analytics
          </label>
          <label className="check-field">
            <input type="checkbox" name="scope" value="WRITE" /> Criação, edição
            e exclusão de links
          </label>
        </fieldset>
        <div>
          <Button type="submit" disabled={pending}>
            <KeyRound size={16} />
            {pending ? "Criando…" : "Criar chave"}
          </Button>
        </div>
      </form>
      {key && (
        <div className="stack" aria-live="polite">
          <p>Guarde esta chave agora. Ela só é exibida nesta etapa.</p>
          <code className="url-preview">{key}</code>
          <div className="page-actions">
            <CopyButton value={key} label="Copiar chave" />
            <Button variant="ghost" onClick={() => setKey(undefined)}>
              Ocultar
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

export function RevokeKeyButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  function revoke() {
    start(async () => {
      const result = await revokeKeyAction(id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Chave revogada.");
      setOpen(false);
    });
  }
  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <Trash2 size={15} /> Revogar
      </Button>
      <Confirm
        open={open}
        setOpen={setOpen}
        title="Revogar chave?"
        description={`As aplicações que usam “${name}” perderão acesso imediatamente.`}
        label="Revogar chave"
        pending={pending}
        confirm={revoke}
      />
    </>
  );
}
