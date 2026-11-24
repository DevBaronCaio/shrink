"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { actionResult } from "@/lib/actions";
import { rateLimit } from "@/lib/rate-limit";
import { AppError } from "@/lib/errors";
import { requireUser, sessionCookie } from "@/modules/auth/auth";
import { updateProfile } from "./service";

export async function saveProfile(input: unknown) {
  const user = await requireUser();
  return actionResult("profile.save", async () => {
    await rateLimit(`profile:${user.id}`, 20, 60);
    const profile = await updateProfile(user.id, input);
    const theme = profile.theme.toLowerCase();
    (await cookies()).set("shrink.theme", theme, {
      path: "/",
      sameSite: "lax",
      maxAge: 31536000,
      secure: sessionCookie().options.secure,
    });
    revalidatePath("/dashboard", "layout");
    return theme;
  });
}

export async function deleteAccount(confirmation: string) {
  const user = await requireUser();
  return actionResult("profile.delete", async () => {
    if (confirmation !== "EXCLUIR")
      throw new AppError(
        422,
        "CONFIRMATION_REQUIRED",
        "Digite EXCLUIR para confirmar.",
      );
    await rateLimit(`profile:${user.id}`, 20, 60);
    await db().user.delete({ where: { id: user.id } });
    const jar = await cookies();
    const session = sessionCookie();
    jar.set(session.name, "", { ...session.options, maxAge: 0 });
    jar.set("shrink.theme", "", {
      path: "/",
      sameSite: "lax",
      maxAge: 0,
      secure: session.options.secure,
    });
    revalidatePath("/", "layout");
    return undefined;
  });
}
