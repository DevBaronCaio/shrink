"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  signInAction,
  signUpAction,
  type CredentialFormState,
} from "./actions";

export function CredentialForm({
  mode,
  returnTo = "/dashboard",
}: {
  mode: "login" | "signup";
  returnTo?: string;
}) {
  const isSignUp = mode === "signup";
  const action = isSignUp ? signUpAction : signInAction;
  const [state, formAction, pending] = useActionState<
    CredentialFormState,
    FormData
  >(action, null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form
      action={formAction}
      onSubmit={() => setShowPassword(false)}
      className="credential-form"
      aria-busy={pending}
    >
      <input type="hidden" name="returnTo" value={returnTo} />
      {isSignUp && (
        <label>
          Nome
          <input
            className="input"
            name="name"
            autoComplete="name"
            minLength={2}
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
      )}
      <label>
        E-mail
        <input
          className="input"
          type="email"
          name="email"
          autoComplete="username"
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <div className="field">
        <label htmlFor="auth-password">Senha</label>
        <div className="auth-password-field">
          <input
            className="input"
            id="auth-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            aria-describedby={isSignUp ? "auth-password-hint" : undefined}
            minLength={isSignUp ? 12 : 1}
            maxLength={128}
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            aria-controls="auth-password"
            onClick={() => setShowPassword((visible) => !visible)}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </Button>
        </div>
        {isSignUp && (
          <small id="auth-password-hint">Use pelo menos 12 caracteres.</small>
        )}
      </div>
      {isSignUp && (
        <label>
          Confirme a senha
          <input
            className="input"
            type="password"
            name="confirmation"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
          />
        </label>
      )}
      {state && (
        <p role="alert" className="error">
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Aguarde…" : isSignUp ? "Criar conta" : "Entrar"}
      </Button>
    </form>
  );
}
