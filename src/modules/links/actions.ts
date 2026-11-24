"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/modules/auth/auth";
import { actionResult } from "@/lib/actions";
import { rateLimit } from "@/lib/rate-limit";
import { createLink, deleteLink, duplicateLink, updateLink } from "./service";

export async function saveLinkAction(id: string | null, data: unknown) {
  const user = await requireUser();
  return actionResult("link.save", async () => {
    await rateLimit(
      id ? `mutate:${user.id}` : `create:${user.id}`,
      id ? 120 : 30,
      id ? 60 : 3600,
    );
    const link = id
      ? await updateLink(user.id, id, data)
      : await createLink(user.id, data);
    revalidatePath("/dashboard", "layout");
    return { id: link.id };
  });
}

export async function linkOperation(
  id: string,
  operation: "delete" | "duplicate" | "activate" | "deactivate",
) {
  const user = await requireUser();
  return actionResult("link.operation", async () => {
    await rateLimit(
      operation === "duplicate" ? `create:${user.id}` : `mutate:${user.id}`,
      operation === "duplicate" ? 30 : 120,
      operation === "duplicate" ? 3600 : 60,
    );
    switch (operation) {
      case "delete":
        await deleteLink(user.id, id);
        break;
      case "duplicate":
        await duplicateLink(user.id, id);
        break;
      case "activate":
        await updateLink(user.id, id, { isActive: true });
        break;
      case "deactivate":
        await updateLink(user.id, id, { isActive: false });
        break;
    }
    revalidatePath("/dashboard", "layout");
    return undefined;
  });
}
