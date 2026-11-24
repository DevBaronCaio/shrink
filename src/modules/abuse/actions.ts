"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/modules/auth/auth";
import { actionResult } from "@/lib/actions";
import { networkSubject, rateLimit } from "@/lib/rate-limit";
import { moderateLink, reportLink } from "./service";

export async function reportAction(input: unknown) {
  return actionResult("abuse.report", async () => {
    await rateLimit(`reports:${networkSubject(await headers())}`, 5, 3600);
    await reportLink(input);
    return undefined;
  });
}

export async function moderateAction(id: string, block: boolean) {
  const user = await requireUser();
  return actionResult("abuse.moderate", async () => {
    await rateLimit(`moderation:${user.id}`, 30, 60);
    await moderateLink(user.id, id, block);
    revalidatePath("/dashboard", "layout");
    return undefined;
  });
}
