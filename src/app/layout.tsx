import type { Metadata } from "next";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
import { appUrl, site } from "@/config/site";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: {
    default: "Shrink — Links menores. Insights maiores.",
    template: "%s · Shrink",
  },
  description: site.description,
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "pt_BR",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: ["/opengraph-image"] },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const cookie = (await cookies()).get("shrink.theme")?.value;
  const theme = cookie === "light" || cookie === "system" ? cookie : "dark";
  return (
    <html lang="pt-BR" data-theme={theme}>
      <body>
        <a className="skip-link" href="#main-content">
          Pular para o conteúdo
        </a>
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
