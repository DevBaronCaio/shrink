"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signInAction, signUpAction, type CredentialFormState } from "./actions";

export function CredentialForm({ mode, returnTo = "/dashboard" }: { mode: "login" | "signup"; returnTo?: string }) {
  const router = useRouter();
  const action = mode === "signup" ? signUpAction : signInAction;
  const [state, formAction, pending] = useActionState(action, null as CredentialFormState);
  useEffect(() => {
    if (state?.ok) {
      router.replace(state.data.redirectTo);
      router.refresh();
    }
  }, [router, state]);

  return (
    <form action={formAction} className="credential-form">
      <input type="hidden" name="returnTo" value={returnTo} />
      {mode === "signup" && <label>Nome<input className="input" name="name" autoComplete="name" minLength={2} maxLength={80} required /></label>}
      <label>E-mail<input className="input" type="email" name="email" autoComplete="email" maxLength={254} required /></label>
      <label>Senha<input className="input" type="password" name="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={mode === "signup" ? 12 : 1} maxLength={128} required />{mode === "signup" && <small>Use pelo menos 12 caracteres.</small>}</label>
      {mode === "signup" && <label>Confirme a senha<input className="input" type="password" name="confirmation" autoComplete="new-password" minLength={12} maxLength={128} required /></label>}
      {state && !state.ok && <p role="alert" className="error">{state.message}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Aguarde…" : mode === "signup" ? "Criar conta" : "Entrar"}</Button>
    </form>
  );
}
