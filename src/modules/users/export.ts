import { db } from "@/lib/db";
import { getProfile } from "./service";

export async function* accountData(userId: string) {
  const prisma = db();
  yield { type: "profile", data: await getProfile(userId) };
  let cursor: string | undefined;
  do {
    const tags = await prisma.tag.findMany({
      where: { userId, id: cursor ? { gt: cursor } : undefined },
      take: 100,
      orderBy: { id: "asc" },
      select: { id: true, name: true, color: true, createdAt: true },
    });
    for (const data of tags) yield { type: "tag", data };
    cursor = tags.length === 100 ? tags.at(-1)?.id : undefined;
  } while (cursor);
  do {
    const links = await prisma.link.findMany({
      where: { userId, id: cursor ? { gt: cursor } : undefined },
      take: 100,
      orderBy: { id: "asc" },
      select: {
        id: true,
        slug: true,
        destinationUrl: true,
        title: true,
        description: true,
        isActive: true,
        expiresAt: true,
        clickLimit: true,
        clickCount: true,
        utm: true,
        qr: true,
        qrCreatedAt: true,
        createdAt: true,
        updatedAt: true,
        tags: { select: { tag: { select: { name: true, color: true } } } },
      },
    });
    for (const { tags, ...data } of links)
      yield {
        type: "link",
        data: { ...data, tags: tags.map(({ tag }) => tag) },
      };
    cursor = links.length === 100 ? links.at(-1)?.id : undefined;
  } while (cursor);
  do {
    const keys = await prisma.apiKey.findMany({
      where: { userId, id: cursor ? { gt: cursor } : undefined },
      take: 100,
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        prefix: true,
        scopes: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
        revokedAt: true,
      },
    });
    for (const data of keys) yield { type: "apiKey", data };
    cursor = keys.length === 100 ? keys.at(-1)?.id : undefined;
  } while (cursor);
}
