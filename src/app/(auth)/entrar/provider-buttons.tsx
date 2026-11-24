"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Github, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProviderButtons({
  providers,
  callback,
}: {
  providers: { github: boolean; google: boolean };
  callback: string;
}) {
  const [pending, setPending] = useState<string>();
  const [error, setError] = useState(false);
  async function login(provider: "github" | "google") {
    setError(false);
    setPending(provider);
    try {
      await signIn(provider, { callbackUrl: callback });
    } catch {
      setError(true);
      setPending(undefined);
    }
  }

  return (
    <div className="stack">
      <Button
        variant="outline"
        disabled={!providers.github || Boolean(pending)}
        onClick={() => void login("github")}
      >
        <Github size={18} />
        {pending === "github" ? "Conectando…" : "Continuar com GitHub"}
      </Button>
      <Button
        variant="outline"
        disabled={!providers.google || Boolean(pending)}
        onClick={() => void login("google")}
      >
        <Globe2 size={18} />
        {pending === "google" ? "Conectando…" : "Continuar com Google"}
      </Button>
      {error && (
        <p role="alert">Falha ao iniciar a autenticação. Tente novamente.</p>
      )}
    </div>
  );
}
