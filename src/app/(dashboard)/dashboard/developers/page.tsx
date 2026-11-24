import Link from "next/link";
import { Braces, KeyRound } from "lucide-react";
import { requireUser } from "@/modules/auth/auth";
import { db } from "@/lib/db";
import { PageTitle } from "@/components/shared/page-title";
import { Button } from "@/components/ui/button";
import { listApiKeys } from "@/modules/api-keys/service";
import { CreateKeyForm, RevokeKeyButton } from "@/modules/api-keys/controls";

export const metadata = { title: "Desenvolvedores" };

export default async function DevelopersPage() {
  const user = await requireUser();
  const [keys, profile] = await Promise.all([
    listApiKeys(user.id),
    db().user.findUnique({
      where: { id: user.id },
      select: { timezone: true },
    }),
  ]);
  const date = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: profile?.timezone ?? "UTC",
  });
  const display = (value: Date | null) => (value ? date.format(value) : "—");
  const now = new Date();
  return (
    <div className="stack views-gap">
      <PageTitle
        title="Desenvolvedores"
        description="Gerencie o acesso à API REST do Shrink."
      >
        <Button variant="outline" asChild>
          <Link href="/docs">
            <Braces size={16} /> Documentação da API
          </Link>
        </Button>
      </PageTitle>
      <CreateKeyForm />
      {keys.length ? (
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Chaves da API"
        >
          <table className="data-table">
            <thead>
              <tr>
                {[
                  "Nome e prefixo",
                  "Escopos",
                  "Criada",
                  "Último uso",
                  "Expira",
                  "Status",
                  "Ações",
                ].map((label) => (
                  <th scope="col" key={label}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => {
                const state = key.revokedAt
                  ? "Revogada"
                  : key.expiresAt && key.expiresAt <= now
                    ? "Expirada"
                    : "Ativa";
                return (
                  <tr key={key.id}>
                    <td>
                      <strong>{key.name}</strong>
                      <br />
                      <code className="helper">{key.prefix}</code>
                    </td>
                    <td>{key.scopes.join(", ")}</td>
                    <td>{display(key.createdAt)}</td>
                    <td>{display(key.lastUsedAt)}</td>
                    <td>{display(key.expiresAt)}</td>
                    <td>
                      <span
                        className={`status-pill ${state === "Ativa" ? "active" : ""}`}
                      >
                        {state}
                      </span>
                    </td>
                    <td>
                      {!key.revokedAt && (
                        <RevokeKeyButton id={key.id} name={key.name} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <section className="panel empty">
          <KeyRound size={25} />
          <h2>Nenhuma chave criada</h2>
          <p>Crie uma chave para iniciar sua integração.</p>
        </section>
      )}
    </div>
  );
}
