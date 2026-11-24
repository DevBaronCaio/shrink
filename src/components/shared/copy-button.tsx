"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export async function copyText(
  value: string,
  label = "Copiado para a área de transferência.",
) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(label);
  } catch {
    toast.error(
      "Não foi possível copiar. Selecione o texto para copiar manualmente.",
    );
  }
}

export function CopyButton({
  value,
  label = "Copiar link",
  iconOnly = false,
}: {
  value: string;
  label?: string;
  iconOnly?: boolean;
}) {
  return (
    <Button
      type="button"
      variant={iconOnly ? "ghost" : "outline"}
      size={iconOnly ? "icon" : "sm"}
      onClick={() => void copyText(value)}
      aria-label={label}
      title={label}
    >
      <Copy size={16} />
      {!iconOnly && label}
    </Button>
  );
}
