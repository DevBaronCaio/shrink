import { timingSafeEqual } from "node:crypto";
import { requestContext } from "@/lib/observability";
import { runRetention } from "@/modules/analytics/retention";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const trace = requestContext("maintenance.retention");
  const headers = { "Cache-Control": "no-store", "X-Request-Id": trace.id };
  const secret = process.env.CRON_SECRET;
  const actual = Buffer.from(request.headers.get("authorization") || "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (
    !secret ||
    secret.length < 32 ||
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  ) {
    return Response.json({ status: "unauthorized" }, { status: 401, headers });
  }
  try {
    const counts = await runRetention();
    console.info(
      JSON.stringify({
        operation: "maintenance.retention",
        requestId: trace.id,
        ...counts,
      }),
    );
    return Response.json({ status: "ok" }, { headers });
  } catch (error) {
    trace.log(503, error);
    return Response.json({ status: "unavailable" }, { status: 503, headers });
  }
}
