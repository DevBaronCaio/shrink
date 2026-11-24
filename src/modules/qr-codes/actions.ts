"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/modules/auth/auth";
import { db } from "@/lib/db";
import { actionResult } from "@/lib/actions";
import { notFound } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { qrSchema } from "./settings";

export async function saveQr(id: string, settings: unknown) {
  const user = await requireUser();
  return actionResult("qr.save", async () => {
    const qr = qrSchema.parse(settings);
    await rateLimit(`mutate:${user.id}`, 120, 60);
    const result = await db().link.updateMany({
      where: { id, userId: user.id },
      data: { qr, qrCreatedAt: new Date() },
    });
    if (!result.count) throw notFound();
    revalidatePath("/dashboard/qr");
    return undefined;
  });
}
