import { ZodError } from "zod";
import { auth } from "@/modules/auth/auth";
import { analyticsCsv } from "@/modules/analytics/csv";
import { getAnalytics } from "@/modules/analytics/service";
import { analyticsKeys } from "@/modules/analytics/period";
import { AppError } from "@/lib/errors";
import { requestContext } from "@/lib/observability";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const trace = requestContext("analytics.export");
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Request-Id": trace.id,
  };
  try {
    const user = (await auth())?.user;
    if (!user)
      throw new AppError(
        401,
        "UNAUTHORIZED",
        "Entre para exportar seus dados.",
      );
    await rateLimit(`export:${user.id}`, 12, 60);
    const params = new URL(request.url).searchParams;
    const input = Object.fromEntries(
      Array.from(params).filter(([key]) =>
        analyticsKeys.some((known) => known === key),
      ),
    );
    const data = await getAnalytics(
      user.id,
      input,
      params.get("link") || undefined,
    );
    return new Response(analyticsCsv(data), {
      headers: {
        ...headers,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="shrink-analytics.csv"',
      },
    });
  } catch (error) {
    const status =
      error instanceof AppError
        ? error.status
        : error instanceof ZodError
          ? 422
          : 500;
    trace.log(status, error);
    return Response.json(
      {
        error:
          error instanceof AppError
            ? error.message
            : "Não foi possível exportar os dados.",
        requestId: trace.id,
      },
      {
        status,
        headers: {
          ...headers,
          ...(error instanceof AppError ? error.headers : {}),
        },
      },
    );
  }
}
