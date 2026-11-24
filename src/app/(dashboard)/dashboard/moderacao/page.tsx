import { notFound } from "next/navigation";
import { requireUser } from "@/modules/auth/auth";
import { AppError } from "@/lib/errors";
import { PageTitle } from "@/components/shared/page-title";
import { listReports } from "@/modules/abuse/service";
import { ModerationButton } from "@/modules/abuse/controls";

export const metadata = { title: "Moderação" };

export default async function ModerationPage() {
  const user = await requireUser();
  const reports = await listReports(user.id).catch((error: unknown) => {
    if (error instanceof AppError && error.status === 403) notFound();
    throw error;
  });
  return (
    <div className="stack views-gap">
      <PageTitle
        title="Moderação"
        description="Revise as denúncias e controle a disponibilidade de links abusivos."
      />
      {reports.length ? (
        <div className="stack">
          {reports.map((report) => (
            <section key={report.id} className="panel moderation-item">
              <div>
                <code>/r/{report.link.slug}</code>
                <p>{report.reason}</p>
                <small className="helper">
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "medium",
                    timeZone: "UTC",
                  }).format(report.createdAt)}{" "}
                  ·{" "}
                  {report.link.blockedAt
                    ? "Bloqueado"
                    : "Disponível para moderação"}
                </small>
              </div>
              <ModerationButton
                id={report.link.id}
                blocked={Boolean(report.link.blockedAt)}
              />
            </section>
          ))}
        </div>
      ) : (
        <section className="panel empty">
          <p>Nenhuma denúncia recebida.</p>
        </section>
      )}
    </div>
  );
}
