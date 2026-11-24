import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { validSlug } from "@/modules/links/slug";
import { linkStatus } from "@/modules/links/rules";
import { clickMetadata } from "./metadata";

export async function resolveRedirect(slug: string, headers: Headers) {
  if (!validSlug(slug)) return { status: "missing" } as const;
  const eventId = randomUUID();
  const event = clickMetadata(headers);
  const accepted = await db().$queryRaw<{ destinationUrl: string }[]>`
    WITH accepted AS (
      UPDATE "Link"
      SET "clickCount" = "clickCount" + 1
      WHERE "slug" = ${slug}
        AND "isActive" AND "blockedAt" IS NULL
        AND ("expiresAt" IS NULL OR "expiresAt" > clock_timestamp())
        AND ("clickLimit" IS NULL OR "clickCount" < "clickLimit")
        AND "clickCount" < 2147483647
      RETURNING id, "destinationUrl", "userId"
    ), recorded AS (
      INSERT INTO "ClickEvent" (
        id, "linkId", country, region, device, browser, "operatingSystem",
        "referrerDomain", "visitorHash", "isBot", "createdAt"
      )
      SELECT ${eventId}::uuid, id, ${event.country}, ${event.region}, ${event.device},
        ${event.browser}, ${event.os}, ${event.referrer},
        encode(sha256(convert_to(${event.networkDigest}::text || ':' || "userId", 'UTF8')), 'hex'),
        ${event.isBot}, clock_timestamp()
      FROM accepted
      RETURNING "linkId"
    )
    SELECT accepted."destinationUrl" FROM accepted JOIN recorded ON recorded."linkId" = accepted.id`;
  if (accepted.length)
    return { status: "ok", destination: accepted[0].destinationUrl } as const;
  const link = await db().link.findUnique({
    where: { slug },
    select: {
      isActive: true,
      blockedAt: true,
      expiresAt: true,
      clickLimit: true,
      clickCount: true,
    },
  });
  if (!link) return { status: "missing" } as const;
  const status = linkStatus(link);
  return { status: status === "active" ? "unavailable" : status } as const;
}
