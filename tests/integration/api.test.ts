import { randomUUID } from "node:crypto";
import { expect, it } from "vitest";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { createApiKey, revokeApiKey } from "@/modules/api-keys/service";
import { GET as list, POST as create } from "@/app/api/v1/links/route";
import {
  GET as get,
  PATCH as patch,
  DELETE as remove,
} from "@/app/api/v1/links/[id]/route";
import { GET as analytics } from "@/app/api/v1/links/[id]/analytics/route";
import { GET as health } from "@/app/api/health/route";
import { GET as spec } from "@/app/api/v1/openapi/route";
import { makeUser } from "./setup";

function request(key?: string, method = "GET", payload?: string, query = "") {
  return new Request(`http://localhost:3000/api/v1/links${query}`, {
    method,
    headers: {
      ...(key ? { authorization: `Bearer ${key}` } : {}),
      ...(payload === undefined ? {} : { "content-type": "application/json" }),
    },
    body: payload,
  });
}

const payload = JSON.stringify({
  title: "Documentação",
  destinationUrl: "https://example.com",
});

it("aplica escopos, propriedade, revogação e códigos do contrato REST", async () => {
  const [alice, bob] = await Promise.all([makeUser(), makeUser()]);
  const [rw, read, other] = await Promise.all([
    createApiKey(alice.id, { name: "Interna", scopes: ["READ", "WRITE"] }),
    createApiKey(alice.id, { name: "Leitor", scopes: ["READ"] }),
    createApiKey(bob.id, { name: "Outra conta", scopes: ["READ", "WRITE"] }),
  ]);
  const credentials = await db().apiKey.findUniqueOrThrow({
    where: { id: rw.id },
  });
  expect(credentials.keyHash).not.toBe(rw.key);
  expect(await list(request())).toMatchObject({ status: 401 });
  expect(await create(request(read.key, "POST", payload))).toMatchObject({
    status: 403,
  });
  expect(await create(request(rw.key, "POST", "{"))).toMatchObject({
    status: 400,
  });
  expect(await create(request(rw.key, "POST", "{}"))).toMatchObject({
    status: 422,
  });
  expect(
    await create(request(rw.key, "POST", "x".repeat(16385))),
  ).toMatchObject({ status: 413 });
  const result = await create(request(rw.key, "POST", payload));
  expect(result.status).toBe(201);
  expect(result.headers.get("x-ratelimit-limit")).toBe("120");
  expect(result.headers.get("x-request-id")).toBeTruthy();
  const { data } = (await result.json()) as {
    data: { id: string; slug: string };
  };
  const context = { params: Promise.resolve({ id: data.id }) };
  expect(result.headers.get("location")).toBe(`/api/v1/links/${data.id}`);
  expect(await get(request(other.key), context)).toMatchObject({ status: 404 });
  expect(
    await patch(request(other.key, "PATCH", '{"title":"Outro"}'), context),
  ).toMatchObject({ status: 404 });
  expect(await analytics(request(other.key), context)).toMatchObject({
    status: 404,
  });
  expect(await remove(request(other.key, "DELETE"), context)).toMatchObject({
    status: 404,
  });
  expect(
    await list(request(read.key, "GET", undefined, "?limit=1&q=doc")),
  ).toMatchObject({ status: 200 });
  expect(
    await list(request(read.key, "GET", undefined, "?limit=1&limit=2")),
  ).toMatchObject({ status: 422 });
  const modified = await patch(
    request(rw.key, "PATCH", '{"title":"Guia atualizado"}'),
    context,
  );
  expect(await modified.json()).toMatchObject({
    data: { id: data.id, slug: data.slug, title: "Guia atualizado" },
  });
  expect(await analytics(request(rw.key), context)).toMatchObject({
    status: 200,
  });
  expect(await remove(request(rw.key, "DELETE"), context)).toMatchObject({
    status: 204,
  });
  expect(
    (await db().apiKey.findUniqueOrThrow({ where: { id: rw.id } })).lastUsedAt,
  ).toBeInstanceOf(Date);
  await expect(revokeApiKey(bob.id, rw.id)).rejects.toMatchObject({
    status: 404,
  });
  await revokeApiKey(alice.id, rw.id);
  await revokeApiKey(alice.id, rw.id);
  expect(await list(request(rw.key))).toMatchObject({ status: 401 });
  await db().apiKey.update({
    where: { id: read.id },
    data: { expiresAt: new Date("2000-01-01Z") },
  });
  expect(await list(request(read.key))).toMatchObject({ status: 401 });
});

it("persiste contagem e impede excedentes simultâneos com 429", async () => {
  const key = `test:${randomUUID()}`;
  try {
    const results = await Promise.allSettled(
      Array.from({ length: 30 }, () => rateLimit(key, 7, 86400)),
    );
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(7);
    expect(
      results.filter((result) => result.status === "rejected"),
    ).toHaveLength(23);
    expect(
      results.find((result) => result.status === "rejected"),
    ).toMatchObject({
      reason: {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "7",
          "X-RateLimit-Remaining": "0",
          "Retry-After": expect.any(String),
        },
      },
    });
    expect(
      (await db().rateLimitBucket.findFirstOrThrow({ where: { key } })).hits,
    ).toBe(7);
    const user = await makeUser();
    const apiKey = await createApiKey(user.id, {
      name: "Rate limit",
      scopes: ["READ"],
    });
    const keyName = `api:key:${apiKey.id}`;
    try {
      await rateLimit(keyName, 1, 60);
      const bucket = await db().rateLimitBucket.findFirstOrThrow({
        where: { key: keyName },
      });
      await db().rateLimitBucket.update({
        where: { key_windowAt: { key: keyName, windowAt: bucket.windowAt } },
        data: { hits: 120 },
      });
      const response = await list(request(apiKey.key));
      expect(response.status).toBe(429);
      expect(response.headers.get("retry-after")).toBeTruthy();
      expect(await response.json()).toMatchObject({
        error: { code: "RATE_LIMITED" },
      });
    } finally {
      await db().rateLimitBucket.deleteMany({ where: { key: keyName } });
    }
  } finally {
    await db().rateLimitBucket.deleteMany({ where: { key } });
  }
});

it("serve health sem detalhes internos e a referência pública 3.1", async () => {
  expect(await (await health()).json()).toEqual({ status: "ok" });
  const document = (await spec().json()) as {
    openapi: string;
    paths: Record<string, object>;
  };
  expect(document.openapi).toBe("3.1.0");
  expect(Object.keys(document.paths)).toEqual([
    "/api/v1/links",
    "/api/v1/links/{id}",
    "/api/v1/links/{id}/analytics",
    "/api/v1/analytics",
    "/api/health",
  ]);
});
