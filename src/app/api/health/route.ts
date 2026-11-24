import { db } from "@/lib/db";
import { requestContext } from "@/lib/observability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const trace = requestContext("health");
  const headers = { "Cache-Control": "no-store", "X-Request-Id": trace.id };
  try {
    await db().$queryRaw`SELECT 1`;
    return Response.json({ status: "ok" }, { headers });
  } catch (error) {
    trace.log(503, error);
    return Response.json({ status: "unavailable" }, { status: 503, headers });
  }
}
