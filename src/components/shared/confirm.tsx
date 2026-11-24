"use client";

import { AlertDialog } from "radix-ui";
import { Button } from "@/components/ui/button";

export function Confirm({
  open,
  setOpen,
  title,
  description,
  label,
  pending,
  confirm,
  children,
  disabled = false,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  description: string;
  label: string;
  pending: boolean;
  confirm: () => void;
  children?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!pending) setOpen(value);
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="dialog-overlay" />
        <AlertDialog.Content className="dialog-content">
          <AlertDialog.Title>{title}</AlertDialog.Title>
          <AlertDialog.Description>{description}</AlertDialog.Description>
          {children}
          <div className="dialog-actions">
            <AlertDialog.Cancel asChild>
              <Button variant="outline" disabled={pending}>
                Cancelar
              </Button>
            </AlertDialog.Cancel>
            <Button
              variant="destructive"
              disabled={pending || disabled}
              onClick={confirm}
            >
              {pending ? "Processando…" : label}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
