import { PageTitle } from "@/components/shared/page-title";
import { UtmBuilder } from "@/modules/campaigns/builder";

export const metadata = { title: "Campanhas UTM" };

export default function UtmPage() {
  return (
    <div className="stack views-gap">
      <PageTitle
        title="Campanhas UTM"
        description="Acrescente parâmetros que identificam a origem dos acessos."
      />
      <UtmBuilder />
    </div>
  );
}
