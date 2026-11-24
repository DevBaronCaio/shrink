import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createServer } from "node:net";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { expect, it } from "vitest";
import { db } from "@/lib/db";
import { makeUser } from "./setup";

it.skipIf(process.env.SHRINK_VERIFY_RUNTIME !== "1")(
  "serve uma sessão real do Auth.js no processo Next.js de produção",
  async () => {
    const socket = createServer();
    socket.listen(0, "127.0.0.1");
    await once(socket, "listening");
    const address = socket.address();
    if (!address || typeof address === "string")
      throw new Error("Falha ao reservar uma porta local.");
    const port = address.port;
    await new Promise<void>((resolve, reject) =>
      socket.close((error) => (error ? reject(error) : resolve())),
    );
    const origin = `http://127.0.0.1:${port}`;
    const next = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        String(port),
      ],
      {
        env: {
          ...process.env,
          DATABASE_URL: process.env.TEST_DATABASE_URL,
          AUTH_SECRET: "integration-runtime-test-secret-32-characters",
          NEXTAUTH_URL: origin,
          AUTH_GITHUB_ID: "",
          AUTH_GITHUB_SECRET: "",
          AUTH_GOOGLE_ID: "",
          AUTH_GOOGLE_SECRET: "",
          VERCEL: undefined,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    const exited = once(next, "exit");
    let serverOutput = "";
    next.stdout.on("data", (chunk: Buffer) => {
      serverOutput += chunk.toString();
    });
    next.stderr.on("data", (chunk: Buffer) => {
      serverOutput += chunk.toString();
    });
    try {
      let ready = false;
      for (let attempt = 0; attempt < 80 && next.exitCode === null; attempt++) {
        const result = await fetch(origin + "/api/health", {
          signal: AbortSignal.timeout(2000),
        }).catch(() => null);
        if (result?.ok) {
          ready = true;
          break;
        }
        await delay(125);
      }
      expect(ready, serverOutput).toBe(true);
      const user = await makeUser();
      const token = randomUUID();
      await db().session.create({
        data: {
          userId: user.id,
          sessionToken: token,
          expires: new Date(Date.now() + 60000),
        },
      });
      const headers = { cookie: `shrink.session=${token}` };
      const session = await fetch(origin + "/api/auth/session", { headers });
      expect(session.status, serverOutput).toBe(200);
      expect(await session.json()).toMatchObject({
        user: { id: user.id, email: user.email },
      });
      const dashboard = await fetch(origin + "/dashboard", {
        headers,
        redirect: "manual",
      });
      expect(dashboard.status, serverOutput).toBe(200);
      expect(await dashboard.text()).toContain("Links ativos");
      await db().session.delete({ where: { sessionToken: token } });
      const revoked = await fetch(origin + "/dashboard", {
        headers,
        redirect: "manual",
      });
      expect(revoked.status).toBe(307);
      expect(revoked.headers.get("location")).toBe("/entrar");
    } finally {
      if (next.exitCode === null && next.signalCode === null) {
        next.kill("SIGTERM");
        await exited;
      }
    }
  },
);
