import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  createLink,
  deleteLink,
  duplicateLink,
  getLink,
  listLinks,
  updateLink,
} from "@/modules/links/service";
import { GET, HEAD } from "@/app/r/[slug]/route";
import { makeUser } from "./setup";

const base = {
  title: "Guia do produto",
  destinationUrl: "https://example.com/guia",
};
const request = (slug: string, headers?: HeadersInit) =>
  GET(new Request(`http://localhost:3000/r/${slug}`, { headers }), {
    params: Promise.resolve({ slug }),
  });

describe("PostgreSQL e redirecionamento", () => {
  it("mantém histórico em edições e aplica ownership a leitura, alteração e exclusão", async () => {
    const [alice, bob] = await Promise.all([makeUser(), makeUser()]);
    const link = await createLink(alice.id, {
      ...base,
      tags: [" Docs ", "docs"],
      utm: { utm_campaign: "guia" },
    });
    const response = await request(link.slug, {
      referer: "https://news.example.com/something",
    });
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://example.com/guia?utm_campaign=guia",
    );
    expect(response.headers.get("cache-control")).toContain("no-store");
    await expect(getLink(bob.id, link.id)).rejects.toMatchObject({
      status: 404,
    });
    await expect(
      updateLink(bob.id, link.id, { title: "inválido" }),
    ).rejects.toMatchObject({ status: 404 });
    await expect(deleteLink(bob.id, link.id)).rejects.toMatchObject({
      status: 404,
    });
    expect((await listLinks(bob.id, {})).total).toBe(0);
    expect(
      (
        await listLinks(alice.id, {
          q: "produto",
          status: "active",
          tag: "docs",
          campaign: "guia",
          sort: "clicks",
        })
      ).items.map(({ id }) => id),
    ).toEqual([link.id]);
    const edited = await updateLink(alice.id, link.id, {
      destinationUrl: "https://example.com/novo",
      tags: ["novo"],
      utm: null,
    });
    expect(edited).toMatchObject({
      slug: link.slug,
      clickCount: 1,
      destinationUrl: "https://example.com/novo",
      tags: [{ name: "novo" }],
    });
    const events = await db().clickEvent.findMany({
      where: { linkId: link.id },
    });
    expect(events).toHaveLength(1);
    expect(events[0].referrerDomain).toBe("news.example.com");
    const copy = await duplicateLink(alice.id, link.id);
    expect(copy).toMatchObject({ isActive: false, clickCount: 0 });
    await deleteLink(alice.id, link.id);
    expect((await request(link.slug)).status).toBe(404);
    expect(await db().clickEvent.count({ where: { linkId: link.id } })).toBe(0);
  });

  it("rejeita slug personalizado duplicado e retenta geração automática", async () => {
    const [alice, bob] = await Promise.all([makeUser(), makeUser()]);
    const slug = `test-${randomUUID().slice(0, 8)}`;
    const created = await createLink(alice.id, {
      ...base,
      slug: slug.toUpperCase(),
    });
    expect(created.slug).toBe(slug);
    await expect(createLink(bob.id, { ...base, slug })).rejects.toMatchObject({
      status: 409,
    });
    const second = `${slug}-retry`;
    const alternatives = [slug, second];
    const result = await createLink(
      bob.id,
      base,
      () => alternatives.shift() ?? slug,
    );
    expect(result.slug).toBe(second);
    await expect(createLink(bob.id, base, () => slug)).rejects.toMatchObject({
      code: "SLUG_UNAVAILABLE",
    });
  });

  it("aceita exatamente 100 de 160 requisições concorrentes e registra os mesmos 100 eventos", async () => {
    const user = await makeUser();
    const link = await createLink(user.id, { ...base, clickLimit: 100 });
    const responses = await Promise.all(
      Array.from({ length: 160 }, () => request(link.slug)),
    );
    expect(responses.filter((res) => res.status === 302)).toHaveLength(100);
    expect(responses.filter((res) => res.status === 410)).toHaveLength(60);
    expect(await getLink(user.id, link.id)).toMatchObject({
      clickCount: 100,
      status: "limited",
    });
    expect(await db().clickEvent.count({ where: { linkId: link.id } })).toBe(
      100,
    );
  });

  it("faz rollback do contador se a inserção do evento falhar", async () => {
    const user = await makeUser();
    const link = await createLink(user.id, { ...base, clickLimit: 1 });
    await db()
      .$executeRaw`CREATE FUNCTION shrink_test_reject_event() RETURNS trigger LANGUAGE plpgsql
      AS $$ BEGIN RAISE EXCEPTION 'falha de persistencia no teste'; END; $$`;
    try {
      await db()
        .$executeRaw`CREATE TRIGGER shrink_test_reject_event BEFORE INSERT ON "ClickEvent"
        FOR EACH ROW EXECUTE FUNCTION shrink_test_reject_event()`;
      try {
        expect((await request(link.slug)).status).toBe(503);
        expect(await getLink(user.id, link.id)).toMatchObject({
          clickCount: 0,
        });
        expect(
          await db().clickEvent.count({ where: { linkId: link.id } }),
        ).toBe(0);
      } finally {
        await db()
          .$executeRaw`DROP TRIGGER shrink_test_reject_event ON "ClickEvent"`;
      }
    } finally {
      await db().$executeRaw`DROP FUNCTION shrink_test_reject_event()`;
    }
    expect((await request(link.slug)).status).toBe(302);
  });

  it("responde 410 para links desativados ou expirados e não contabiliza HEAD", async () => {
    const user = await makeUser();
    const link = await createLink(user.id, { ...base, isActive: false });
    expect((await request(link.slug)).status).toBe(410);
    expect(HEAD().status).toBe(405);
    await db().link.update({
      where: { id: link.id },
      data: { isActive: true, expiresAt: new Date("2000-01-01Z") },
    });
    expect((await request(link.slug)).status).toBe(410);
    expect(await db().clickEvent.count({ where: { linkId: link.id } })).toBe(0);
  });
});
