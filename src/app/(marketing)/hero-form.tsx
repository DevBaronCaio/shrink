"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useState, type FormEvent } from "react";
import { Check, Link2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryString } from "@/lib/query";
import { webUrl } from "@/modules/campaigns/utm";
import { MAX_DESTINATION_LENGTH } from "@/modules/links/new-link-path";

export function HeroForm({ origin }: { origin: string }) {
  const reduceMotion = useReducedMotion();
  const [destination, setDestination] = useState("");
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      webUrl(destination);
      setPreview(destination.trim());
      setError("");
    } catch {
      setPreview("");
      setError("Insira uma URL válida com https:// ou http://.");
    }
  }

  return (
    <div className="hero-form-wrap">
      <form
        className="hero-form"
        onSubmit={submit}
        aria-label="Prévia do encurtador"
      >
        <Link2 size={19} aria-hidden="true" />
        <Input
          aria-label="URL de destino"
          inputMode="url"
          type="text"
          placeholder="https://exemplo.com/seu-link"
          value={destination}
          maxLength={MAX_DESTINATION_LENGTH}
          required
          onChange={(event) => {
            setDestination(event.target.value);
            setPreview("");
            setError("");
          }}
        />
        <Button type="submit">Ver prévia</Button>
      </form>
      {error && (
        <p className="error helper" role="alert">
          {error}
        </p>
      )}
      {preview ? (
        <motion.div
          className="hero-preview"
          aria-live="polite"
          initial={reduceMotion ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16 }}
        >
          <div className="hero-preview-result">
            <Check size={16} aria-hidden="true" /> <strong>Prévia</strong>
            <code>{new URL(origin).host}/r/seu-link</code>
          </div>
          <div className="hero-preview-actions">
            <Link href={`/criar-conta${queryString({ destino: preview })}`}>
              Criar conta e encurtar
            </Link>
            <Link href={`/entrar${queryString({ destino: preview })}`}>
              Já tenho conta
            </Link>
          </div>
        </motion.div>
      ) : (
        <small className="hero-note">
          <LockKeyhole size={13} /> Experimente a prévia sem criar conta.
        </small>
      )}
    </div>
  );
}
