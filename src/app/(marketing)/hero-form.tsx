"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useState, type FormEvent } from "react";
import { Check, Link2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HeroForm({ origin }: { origin: string }) {
  const reduceMotion = useReducedMotion();
  const [destination, setDestination] = useState("");
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const url = new URL(destination.trim());
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password
      )
        throw new Error();
      setPreview(url.href);
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
          maxLength={2048}
          required
          onChange={(event) => {
            setDestination(event.target.value);
            setPreview("");
            setError("");
          }}
        />
        <Button type="submit">Encurtar link</Button>
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
          <div>
            <Check size={16} /> <strong>Prévia</strong>
            <code>{new URL(origin).host}/r/seu-link</code>
          </div>
          <Link href={`/entrar?destino=${encodeURIComponent(preview)}`}>
            Entrar e criar
          </Link>
        </motion.div>
      ) : (
        <small className="hero-note">
          <LockKeyhole size={13} /> Experimente a prévia sem criar conta.
        </small>
      )}
    </div>
  );
}
