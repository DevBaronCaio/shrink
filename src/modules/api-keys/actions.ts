"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/modules/auth/auth";
import { actionResult } from "@/lib/actions";
import { rateLimit } from "@/lib/rate-limit";
import { createApiKey, revokeApiKey } from "./service";

export async function createKeyAction(input: unknown) {
  const user = await requireUser();
  return actionResult("apiKey.create", async () => {
    await rateLimit(`keys:${user.id}`, 10, 3600);
    const result = await createApiKey(user.id, input);
    revalidatePath("/dashboard/developers");
    return result.key;
  });
}

export async function revokeKeyAction(id: string) {
  const user = await requireUser();
  return actionResult("apiKey.revoke", async () => {
    await rateLimit(`mutate:${user.id}`, 120, 60);
    await revokeApiKey(user.id, id);
    revalidatePath("/dashboard/developers");
    return undefined;
  });
}
