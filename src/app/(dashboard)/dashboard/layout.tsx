import type { ReactNode } from "react";
import { requireUser } from "@/modules/auth/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { canModerate } from "@/modules/abuse/permissions";
import { site } from "@/config/site";

export const runtime = "nodejs";
export const metadata = { robots: { index: false, follow: false } };

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  return (
    <DashboardShell
      name={user.name}
      email={user.email}
      image={user.image}
      theme={user.theme}
      github={site.github}
      moderator={await canModerate(user.id)}
    >
      {children}
    </DashboardShell>
  );
}
