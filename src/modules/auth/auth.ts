import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { getServerSession, type NextAuthOptions } from "next-auth";
import type { AdapterAccount } from "next-auth/adapters";
import { cookies } from "next/headers";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { cache } from "react";
import { redirect } from "next/navigation";
import { appUrl } from "@/config/site";
import { db } from "@/lib/db";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      theme?: "dark" | "light" | "system";
    };
  }
}

export function availableProviders() {
  return {
    github: Boolean(
      process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET,
    ),
    google: Boolean(
      process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
    ),
  };
}

export function sessionCookie() {
  const secure = appUrl().startsWith("https:") || Boolean(process.env.VERCEL);
  return {
    name: secure ? "__Host-shrink.session" : "shrink.session",
    options: { httpOnly: true, sameSite: "lax" as const, path: "/", secure },
  };
}

export function authOptions(): NextAuthOptions {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET inválido");
  const providers: NextAuthOptions["providers"] = [];
  if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
    providers.push(
      GitHub({
        clientId: process.env.AUTH_GITHUB_ID,
        clientSecret: process.env.AUTH_GITHUB_SECRET,
      }),
    );
  }
  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    providers.push(
      Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
      }),
    );
  }
  const cookie = sessionCookie();
  const adapter = PrismaAdapter(db());
  return {
    secret,
    providers,
    adapter: {
      ...adapter,
      async linkAccount({
        userId,
        type,
        provider,
        providerAccountId,
      }: AdapterAccount) {
        return db().account.create({
          data: { userId, type, provider, providerAccountId },
        });
      },
    },
    session: { strategy: "database", maxAge: 7 * 86400, updateAge: 86400 },
    useSecureCookies: cookie.options.secure,
    cookies: { sessionToken: cookie },
    pages: { signIn: "/entrar", error: "/entrar" },
    callbacks: {
      session({ session, user }) {
        const preference = "theme" in user ? user.theme : null;
        const theme =
          preference === "LIGHT"
            ? "light"
            : preference === "SYSTEM"
              ? "system"
              : "dark";
        return { ...session, user: { ...session.user, id: user.id, theme } };
      },
    },
    logger: {
      error(code) {
        console.error(JSON.stringify({ operation: "auth", code }));
      },
      warn(code) {
        console.warn(JSON.stringify({ operation: "auth", code }));
      },
      debug() {},
    },
  };
}

export const auth = cache(async () => {
  if (!(await cookies()).has(sessionCookie().name)) return null;
  return getServerSession(authOptions());
});

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/entrar");
  return session.user;
}
