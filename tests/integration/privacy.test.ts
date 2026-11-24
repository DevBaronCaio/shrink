import { randomUUID } from "node:crypto";
import { expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { createLink, updateLink } from "@/modules/links/service";
import { createApiKey } from "@/modules/api-keys/service";
import { listReports, moderateLink, reportLink } from "@/modules/abuse/service";
import { resolveRedirect } from "@/modules/redirect/service";
import { runRetention } from "@/modules/analytics/retention";
import { updateProfile } from "@/modules/users/service";
import { accountData } from "@/modules/users/export";
import { makeUser } from "./setup";

const target = { title: "Link oficial", destinationUrl: "https://example.org" };

it("modera com identidade OAuth imutável e impede o proprietário de remover o bloqueio", async () => {
  const [owner, moderator] = await Promise.all([makeUser(), makeUser()]);
  const providerAccountId = randomUUID();
  await db().account.create({
    data: {
      userId: moderator.id,
      provider: "github",
      type: "oauth",
      providerAccountId,
    },
  });
  vi.stubEnv("MODERATOR_IDENTITIES", `github:${providerAccountId}`);
  try {
    const link = await createLink(owner.id, target);
    await reportLink({
      slug: link.slug,
      reason: "O link aparenta imitar outro serviço.",
    });
    await expect(listReports(owner.id)).rejects.toMatchObject({ status: 403 });
    await expect(moderateLink(owner.id, link.id, true)).rejects.toMatchObject({
      status: 403,
    });
    expect(await listReports(moderator.id)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          link: expect.objectContaining({ id: link.id }),
        }),
      ]),
    );
    await moderateLink(moderator.id, link.id, true);
    await updateLink(owner.id, link.id, {
      title: "Outro título",
      isActive: true,
    });
    expect(await resolveRedirect(link.slug, new Headers())).toEqual({
      status: "blocked",
    });
    await moderateLink(moderator.id, link.id, false);
    expect(await resolveRedirect(link.slug, new Headers())).toMatchObject({
      status: "ok",
    });
  } finally {
    vi.unstubAllEnvs();
  }
});

it("exporta somente os dados da conta e a exclusão remove links, chaves e sessões", async () => {
  const [owner, other] = await Promise.all([makeUser(), makeUser()]);
  const link = await createLink(owner.id, {
    ...target,
    tags: ["documentacao"],
  });
  const outsider = await createLink(other.id, {
    ...target,
    title: "Link alheio",
  });
  const key = await createApiKey(owner.id, {
    name: "Integração",
    scopes: ["READ"],
  });
  const session = await db().session.create({
    data: {
      userId: owner.id,
      sessionToken: randomUUID(),
      expires: new Date("2099-01-01Z"),
    },
  });
  await updateProfile(owner.id, {
    name: "Pessoa",
    image: null,
    theme: "LIGHT",
    timezone: "Europe/Lisbon",
  });
  await resolveRedirect(link.slug, new Headers());
  const exported = [];
  for await (const record of accountData(owner.id)) exported.push(record);
  expect(exported.map(({ type }) => type)).toEqual([
    "profile",
    "tag",
    "link",
    "apiKey",
  ]);
  const encoded = JSON.stringify(exported);
  expect(encoded).toContain(link.id);
  expect(encoded).not.toContain(outsider.id);
  expect(encoded).not.toContain(key.key);
  expect(encoded).not.toContain(session.sessionToken);
  await db().user.delete({ where: { id: owner.id } });
  expect(await db().clickEvent.count({ where: { linkId: link.id } })).toBe(0);
  expect(await db().apiKey.count({ where: { id: key.id } })).toBe(0);
  expect(await db().session.count({ where: { id: session.id } })).toBe(0);
});

it("remove eventos vencidos sem diminuir o contador histórico e expira sessões e janelas", async () => {
  const owner = await makeUser();
  const link = await createLink(owner.id, target);
  await resolveRedirect(link.slug, new Headers());
  await resolveRedirect(link.slug, new Headers());
  const click = await db().clickEvent.findFirstOrThrow({
    where: { linkId: link.id },
  });
  const old = new Date("2000-01-01T00:00:00Z");
  await db().clickEvent.update({
    where: { id: click.id },
    data: { createdAt: old },
  });
  const session = await db().session.create({
    data: { userId: owner.id, sessionToken: randomUUID(), expires: old },
  });
  const key = `expired-test:${randomUUID()}`;
  await db().rateLimitBucket.create({
    data: {
      key,
      hits: 1,
      windowAt: old,
      expiresAt: new Date(old.getTime() + 60000),
    },
  });
  const result = await runRetention();
  expect(result.events).toBeGreaterThanOrEqual(1);
  expect(await db().clickEvent.count({ where: { linkId: link.id } })).toBe(1);
  expect(
    (await db().link.findUniqueOrThrow({ where: { id: link.id } })).clickCount,
  ).toBe(2);
  expect(await db().session.count({ where: { id: session.id } })).toBe(0);
  expect(await db().rateLimitBucket.count({ where: { key } })).toBe(0);
});
