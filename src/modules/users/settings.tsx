"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/shared/avatar";
import { Confirm } from "@/components/shared/confirm";
import { saveProfile, deleteAccount } from "./actions";

const themes = {
  DARK: "Escuro",
  LIGHT: "Claro",
  SYSTEM: "Do dispositivo",
} as const;
type Fields = {
  name: string | null;
  email: string | null;
  image: string | null;
  theme: keyof typeof themes;
  timezone: string;
};

export function SettingsForm({ profile }: { profile: Fields }) {
  const [pending, start] = useTransition();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    start(async () => {
      const result = await saveProfile({
        name: data.get("name"),
        image: data.get("image") || null,
        theme: data.get("theme"),
        timezone: data.get("timezone"),
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      document.documentElement.dataset.theme = result.data;
      toast.success("Preferências salvas.");
    });
  }

  return (
    <form className="panel editor-form" onSubmit={submit}>
      <div className="profile-overview">
        <Avatar
          name={profile.name}
          email={profile.email}
          image={profile.image}
        />
        <div>
          <h2>Perfil</h2>
          <p>{profile.email || "Conta OAuth"}</p>
        </div>
      </div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="settings-name">Nome</label>
          <Input
            id="settings-name"
            name="name"
            defaultValue={profile.name ?? ""}
            maxLength={80}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="settings-avatar">URL do avatar</label>
          <Input
            id="settings-avatar"
            type="url"
            name="image"
            maxLength={2048}
            defaultValue={profile.image ?? ""}
            placeholder="https://…"
          />
        </div>
        <div className="field">
          <label htmlFor="settings-theme">Tema</label>
          <select
            id="settings-theme"
            className="input"
            name="theme"
            defaultValue={profile.theme}
          >
            {Object.entries(themes).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="settings-timezone">Fuso de analytics</label>
          <Input
            id="settings-timezone"
            name="timezone"
            list="common-timezones"
            defaultValue={profile.timezone}
            maxLength={80}
            required
          />
          <datalist id="common-timezones">
            {[
              "America/Belem",
              "America/Sao_Paulo",
              "America/Manaus",
              "America/New_York",
              "Europe/Lisbon",
              "UTC",
            ].map((timezone) => (
              <option value={timezone} key={timezone} />
            ))}
          </datalist>
        </div>
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          <Save size={16} /> {pending ? "Salvando…" : "Salvar perfil"}
        </Button>
      </div>
    </form>
  );
}

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  function confirm() {
    start(async () => {
      const result = await deleteAccount(value);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setOpen(false);
      toast.success("Conta excluída.");
      router.replace("/");
    });
  }
  return (
    <>
      <Button
        variant="destructive"
        onClick={() => {
          setValue("");
          setOpen(true);
        }}
      >
        <Trash2 size={16} /> Excluir conta
      </Button>
      <Confirm
        open={open}
        setOpen={setOpen}
        title="Excluir sua conta?"
        description="Seus links, eventos, chaves e sessões serão removidos permanentemente. Digite EXCLUIR para confirmar."
        label="Excluir conta definitivamente"
        pending={pending}
        disabled={value !== "EXCLUIR"}
        confirm={confirm}
      >
        <div className="field">
          <label htmlFor="delete-confirmation">Confirmação</label>
          <Input
            id="delete-confirmation"
            autoComplete="off"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </div>
      </Confirm>
    </>
  );
}
