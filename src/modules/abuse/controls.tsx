"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Confirm } from "@/components/shared/confirm";
import { moderateAction, reportAction } from "./actions";

export function ReportForm({ slug }: { slug?: string }) {
  const [pending, start] = useTransition();
  const [message, showMessage] = useState<{ success: boolean; text: string }>();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    start(async () => {
      const result = await reportAction({
        slug: data.get("slug"),
        reason: data.get("reason"),
      });
      showMessage(
        result.ok
          ? { success: true, text: "Denúncia recebida para revisão." }
          : { success: false, text: result.message },
      );
    });
  }
  return message?.success ? (
    <p role="status">{message.text}</p>
  ) : (
    <form className="stack" onSubmit={submit}>
      <div className="field">
        <label htmlFor="report-slug">Slug do link</label>
        <Input
          name="slug"
          id="report-slug"
          defaultValue={slug}
          minLength={3}
          maxLength={48}
          required
          placeholder="Ex.: para denunciar /r/guia, digite guia"
        />
      </div>
      <div className="field">
        <label htmlFor="report-reason">Motivo</label>
        <textarea
          name="reason"
          id="report-reason"
          className="input"
          minLength={10}
          maxLength={500}
          required
        />
      </div>
      {message && (
        <p className="error" role="alert">
          {message.text}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Enviando…" : "Enviar denúncia"}
      </Button>
    </form>
  );
}

export function ModerationButton({
  id,
  blocked,
}: {
  id: string;
  blocked: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  function confirm() {
    start(async () => {
      const result = await moderateAction(id, !blocked);
      if (result.ok) {
        setOpen(false);
        toast.success(blocked ? "Link desbloqueado." : "Link bloqueado.");
      } else toast.error(result.message);
    });
  }
  return (
    <>
      <Button
        variant={blocked ? "outline" : "destructive"}
        size="sm"
        disabled={pending}
        onClick={() => {
          if (blocked) confirm();
          else setOpen(true);
        }}
      >
        {blocked ? "Desbloquear" : "Bloquear"}
      </Button>
      <Confirm
        open={open}
        setOpen={setOpen}
        title="Bloquear link?"
        description="O link deixará de redirecionar até ser liberado pela moderação."
        label="Bloquear link"
        pending={pending}
        confirm={confirm}
      />
    </>
  );
}
