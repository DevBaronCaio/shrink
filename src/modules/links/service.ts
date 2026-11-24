import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError, notFound } from "@/lib/errors";
import { shortUrl } from "@/config/site";
import { utmSchema } from "@/modules/campaigns/utm";
import { validateDestination } from "./destination";
import { normalizeSlug, randomSlug, validSlug } from "./slug";
import { linkStatus, parseExpiry } from "./rules";
import {
  createLinkSchema,
  listLinkSchema,
  updateLinkSchema,
  type ListQuery,
} from "./schema";

const selection = {
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
  blockedAt: true,
  createdAt: true,
  updatedAt: true,
  tags: {
    select: { tag: { select: { name: true, color: true } } },
    orderBy: { tag: { name: "asc" } },
  },
} satisfies Prisma.LinkSelect;

function serialize(
  link: Prisma.LinkGetPayload<{ select: typeof selection }>,
  now = new Date(),
) {
  const { tags, blockedAt, qr, qrCreatedAt, ...fields } = link;
  return {
    ...fields,
    expiresAt: link.expiresAt?.toISOString() ?? null,
    createdAt: link.createdAt.toISOString(),
    updatedAt: link.updatedAt.toISOString(),
    qrCreatedAt: qrCreatedAt?.toISOString() ?? null,
    status: linkStatus({ ...link, blockedAt }, now),
    shortUrl: shortUrl(link.slug),
    tags: tags.map(({ tag }) => tag),
    utm: utmSchema.safeParse(link.utm).data ?? null,
    qr,
  };
}
export type ManagedLink = ReturnType<typeof serialize>;

function slugValue(value: string) {
  const slug = normalizeSlug(value);
  if (!validSlug(slug))
    throw new AppError(
      422,
      "INVALID_SLUG",
      "Use 3 a 48 letras, números, hífens ou sublinhados. Comece e termine com letra ou número.",
    );
  return slug;
}

const slugConflict = () =>
  new AppError(409, "SLUG_CONFLICT", "Este slug já está em uso.");

function uniqueViolation(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function replaceTags(
  tx: Prisma.TransactionClient,
  userId: string,
  linkId: string,
  names: string[],
) {
  await tx.linkTag.deleteMany({ where: { linkId } });
  if (!names.length) return;
  await tx.tag.createMany({
    data: names.map((name) => ({ userId, name })),
    skipDuplicates: true,
  });
  const tags = await tx.tag.findMany({
    where: { userId, name: { in: names } },
    select: { id: true },
  });
  await tx.linkTag.createMany({
    data: tags.map(({ id }) => ({ linkId, tagId: id })),
  });
}

async function owned(tx: Prisma.TransactionClient, userId: string, id: string) {
  const link = await tx.link.findUnique({
    where: { id, userId },
    select: selection,
  });
  if (!link) throw notFound();
  return link;
}

export async function createLink(
  userId: string,
  input: unknown,
  generateSlug = randomSlug,
) {
  const {
    slug: custom,
    tags,
    utm,
    expiresAt,
    destinationUrl,
    ...fields
  } = createLinkSchema.parse(input);
  const expiry = parseExpiry(expiresAt);
  const destination = validateDestination(destinationUrl, utm);
  const manual = custom === undefined ? undefined : slugValue(custom);
  for (let attempt = 0; attempt < (manual ? 1 : 5); attempt++) {
    try {
      return serialize(
        await db().$transaction(async (tx) => {
          const { id } = await tx.link.create({
            data: {
              ...fields,
              userId,
              slug: manual ?? generateSlug(),
              destinationUrl: destination,
              expiresAt: expiry,
              utm: utm ?? Prisma.DbNull,
            },
            select: { id: true },
          });
          if (tags) await replaceTags(tx, userId, id, tags);
          return owned(tx, userId, id);
        }),
      );
    } catch (error) {
      if (!uniqueViolation(error)) throw error;
      if (manual) throw slugConflict();
    }
  }
  throw new AppError(
    503,
    "SLUG_UNAVAILABLE",
    "Não foi possível gerar um slug. Tente novamente.",
  );
}

export async function getLink(userId: string, id: string) {
  return serialize(await owned(db(), userId, id));
}

export async function updateLink(userId: string, id: string, input: unknown) {
  const { slug, tags, destinationUrl, utm, expiresAt, ...fields } =
    updateLinkSchema.parse(input);
  try {
    const link = await db().$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        {
          destinationUrl: string;
          expiresAt: Date | null;
          utm: Prisma.JsonValue;
        }[]
      >`
        SELECT "destinationUrl", "expiresAt", "utm" FROM "Link" WHERE id = ${id} AND "userId" = ${userId} FOR UPDATE`;
      const current = rows[0];
      if (!current) throw notFound();
      const currentUtm = utmSchema.safeParse(current.utm).data;
      let destination: string | undefined;
      if (destinationUrl !== undefined || utm !== undefined) {
        const source = new URL(destinationUrl ?? current.destinationUrl);
        if (destinationUrl === undefined && utm !== undefined && currentUtm) {
          for (const [name, value] of Object.entries(currentUtm)) {
            if (source.searchParams.get(name) === value)
              source.searchParams.delete(name);
          }
        }
        destination = validateDestination(
          source.href,
          utm === undefined ? currentUtm : utm,
        );
      }
      await tx.link.update({
        where: { id, userId },
        data: {
          ...fields,
          slug: slug === undefined ? undefined : slugValue(slug),
          destinationUrl: destination,
          expiresAt: parseExpiry(expiresAt, current.expiresAt),
          utm: utm === undefined ? undefined : (utm ?? Prisma.DbNull),
        },
        select: { id: true },
      });
      if (tags) await replaceTags(tx, userId, id, tags);
      return owned(tx, userId, id);
    });
    return serialize(link);
  } catch (error) {
    if (uniqueViolation(error)) throw slugConflict();
    throw error;
  }
}

export async function deleteLink(userId: string, id: string) {
  const { count } = await db().link.deleteMany({ where: { id, userId } });
  if (!count) throw notFound();
}

export async function duplicateLink(userId: string, id: string) {
  const link = await getLink(userId, id);
  return createLink(userId, {
    title: `${link.title.slice(0, 111)} (cópia)`,
    destinationUrl: link.destinationUrl,
    description: link.description,
    isActive: false,
    clickLimit: link.clickLimit,
    tags: link.tags.map(({ name }) => name),
    utm: link.utm,
  });
}

function range(query: ListQuery) {
  const end = query.to ? new Date(`${query.to}T00:00:00Z`) : undefined;
  end?.setUTCDate(end.getUTCDate() + 1);
  return query.from || end
    ? {
        gte: query.from ? new Date(`${query.from}T00:00:00Z`) : undefined,
        lt: end,
      }
    : undefined;
}

export async function listLinks(userId: string, input: unknown) {
  const query = listLinkSchema.parse(input);
  const now = new Date();
  const client = db();
  const unblocked = { blockedAt: null };
  const usable = {
    ...unblocked,
    isActive: true,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };
  const { clickCount } = client.link.fields;
  const notLimited = {
    OR: [{ clickLimit: null }, { clickLimit: { gt: clickCount } }],
  };
  const statuses: Record<
    NonNullable<ListQuery["status"]>,
    Prisma.LinkWhereInput
  > = {
    blocked: { blockedAt: { not: null } },
    inactive: { ...unblocked, isActive: false },
    expired: { ...unblocked, isActive: true, expiresAt: { lte: now } },
    limited: { AND: [usable, { clickLimit: { lte: clickCount } }] },
    active: { AND: [usable, notLimited] },
  };
  const where: Prisma.LinkWhereInput = {
    userId,
    createdAt: range(query),
    tags: query.tag
      ? { some: { tag: { userId, name: query.tag } } }
      : undefined,
    utm: query.campaign
      ? { path: ["utm_campaign"], equals: query.campaign }
      : undefined,
    AND: [
      query.status ? statuses[query.status] : {},
      query.q
        ? {
            OR: ["title", "slug", "destinationUrl"].map((field) => ({
              [field]: {
                contains: query.q?.replace(/[\\%_]/g, "\\$&"),
                mode: "insensitive",
              },
            })),
          }
        : {},
    ],
  };
  const orderBy: Prisma.LinkOrderByWithRelationInput[] = [
    query.sort === "clicks"
      ? { clickCount: "desc" }
      : { createdAt: query.sort === "oldest" ? "asc" : "desc" },
    { id: "asc" },
  ];
  const [total, links] = await client.$transaction(
    [
      client.link.count({ where }),
      client.link.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: selection,
      }),
    ],
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
  );
  return {
    items: links.map((link) => serialize(link, now)),
    page: query.page,
    limit: query.limit,
    total,
    pages: Math.ceil(total / query.limit),
  };
}

export async function listTags(userId: string) {
  return db().tag.findMany({
    where: { userId, links: { some: { link: { userId } } } },
    select: { name: true, color: true },
    orderBy: { name: "asc" },
    take: 200,
  });
}

export async function dashboardLinks(userId: string) {
  const now = new Date();
  const near = new Date(now.getTime() + 7 * 86400000);
  const client = db();
  const [stats, recent, expiring] = await client.$transaction([
    client.$queryRaw<{ links: number; active: number; clicks: number }[]>`
      SELECT COUNT(*)::int AS links,
        COUNT(*) FILTER (WHERE "blockedAt" IS NULL AND "isActive" AND ("expiresAt" IS NULL OR "expiresAt" > ${now})
          AND ("clickLimit" IS NULL OR "clickCount" < "clickLimit"))::int AS active,
        COALESCE(SUM("clickCount"), 0)::double precision AS clicks
      FROM "Link" WHERE "userId" = ${userId}`,
    client.link.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: selection,
    }),
    client.link.findMany({
      where: {
        userId,
        blockedAt: null,
        isActive: true,
        expiresAt: { gt: now, lte: near },
        OR: [
          { clickLimit: null },
          { clickLimit: { gt: client.link.fields.clickCount } },
        ],
      },
      orderBy: { expiresAt: "asc" },
      take: 5,
      select: selection,
    }),
  ]);
  return {
    ...stats[0],
    recent: recent.map((link) => serialize(link, now)),
    expiring: expiring.map((link) => serialize(link, now)),
  };
}
