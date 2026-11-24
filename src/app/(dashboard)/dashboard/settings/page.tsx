import Link from "next/link";
import { Download } from "lucide-react";
import { requireUser } from "@/modules/auth/auth";
import { getProfile } from "@/modules/users/service";
import { DeleteAccountButton, SettingsForm } from "@/modules/users/settings";
import { PageTitle } from "@/components/shared/page-title";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  return (
    <div className="stack views-gap">
      <PageTitle
        title="Configurações"
        description="Atualize seu perfil, tema e fuso horário."
      />
      <SettingsForm profile={profile} />
      <section className="panel editor-form">
        <h2>Seus dados</h2>
        <p>
          Baixe seu perfil, links, tags e metadados das chaves. A exportação de
          analytics está disponível na área de Analytics.
        </p>
        <div className="page-actions">
          <Button asChild variant="outline">
            <a href="/api/dashboard/account">
              <Download size={16} /> Exportar minha conta
            </a>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/privacidade">Política de privacidade</Link>
          </Button>
        </div>
      </section>
      <section className="panel editor-form">
        <h2>Excluir conta</h2>
        <p>
          Esta ação encerra suas sessões e remove de forma permanente links,
          eventos e chaves.
        </p>
        <div>
          <DeleteAccountButton />
        </div>
      </section>
    </div>
  );
}
