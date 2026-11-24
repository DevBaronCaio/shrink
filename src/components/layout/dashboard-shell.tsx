"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Activity,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  Code2,
  Github,
  Link2,
  LogOut,
  Moon,
  Plus,
  QrCode,
  Search,
  Settings,
  Shield,
  Sun,
  Tags,
  UserRound,
} from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { Brand } from "./brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/shared/avatar";

const items = [
  {
    href: "/dashboard",
    label: "Visão geral",
    icon: ChartNoAxesColumnIncreasing,
  },
  { href: "/dashboard/links", label: "Links", icon: Link2 },
  { href: "/dashboard/analytics", label: "Analytics", icon: Activity },
  { href: "/dashboard/qr", label: "QR Codes", icon: QrCode },
  { href: "/dashboard/utm", label: "Campanhas UTM", icon: Tags },
  { href: "/dashboard/developers", label: "Desenvolvedores", icon: Code2 },
  { href: "/dashboard/settings", label: "Configurações", icon: Settings },
];

export function DashboardShell({
  children,
  name,
  email,
  image,
  theme,
  github,
  moderator,
}: {
  children: React.ReactNode;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  theme?: "dark" | "light" | "system";
  github: string;
  moderator: boolean;
}) {
  const pathname = usePathname();
  const links = moderator
    ? [
        ...items,
        { href: "/dashboard/moderacao", label: "Moderação", icon: Shield },
      ]
    : items;
  const active = links.find(({ href }) =>
    href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`),
  );
  useEffect(() => {
    if (
      theme &&
      !document.cookie
        .split("; ")
        .some((entry) => entry.startsWith("shrink.theme="))
    ) {
      document.documentElement.dataset.theme = theme;
    }
  }, [theme]);

  function toggleTheme() {
    const root = document.documentElement;
    const dark =
      root.dataset.theme === "dark" ||
      (root.dataset.theme === "system" &&
        matchMedia("(prefers-color-scheme: dark)").matches);
    const theme = dark ? "light" : "dark";
    root.dataset.theme = theme;
    document.cookie = `shrink.theme=${theme}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  }

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Brand href="/dashboard" />
        </div>
        <nav className="sidebar-nav" aria-label="Área de trabalho">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={active?.href === href ? "page" : undefined}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <a href={github}>
            <Github size={17} />
            GitHub
          </a>
          <button type="button" onClick={toggleTheme}>
            <Sun size={17} className="theme-sun" />
            <Moon size={17} className="theme-moon" /> Alternar tema
          </button>
          <Link className="sidebar-profile" href="/dashboard/settings">
            <Avatar name={name} email={email} image={image} />
            <span>
              <strong>{name || "Minha conta"}</strong>
              {email && <small>{email}</small>}
            </span>
          </Link>
        </div>
      </aside>
      <div className="workspace">
        <header className="workspace-top">
          <div className="workspace-crumb">
            <Link href="/dashboard">Workspace</Link>
            <span>/</span>
            <span aria-current="page">{active?.label || "Painel"}</span>
          </div>
          <div className="workspace-tools">
            <form className="top-search" action="/dashboard/links">
              <Search size={16} />
              <Input
                name="q"
                placeholder="Buscar links…"
                aria-label="Buscar links no workspace"
                maxLength={150}
              />
            </form>
            <Button size="sm" asChild>
              <Link href="/dashboard/links/novo">
                <Plus size={17} /> Novo link
              </Link>
            </Button>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menu da conta">
                  <Avatar name={name} email={email} image={image} small />
                  <ChevronDown size={12} className="profile-chevron" />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="dropdown"
                  align="end"
                  sideOffset={7}
                >
                  <DropdownMenu.Item className="dropdown-item" asChild>
                    <Link href="/dashboard/settings">
                      <UserRound size={16} /> Minha conta
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className="dropdown-item"
                    onSelect={toggleTheme}
                  >
                    <Sun size={16} /> Alternar tema
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className="dropdown-item"
                    onSelect={() => void signOut({ callbackUrl: "/" })}
                  >
                    <LogOut size={16} /> Sair
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </header>
        <main id="main-content" className="workspace-main">
          {children}
        </main>
      </div>
    </div>
  );
}
