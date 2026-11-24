import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { authOptions } from "@/modules/auth/auth";
import { AppError } from "@/lib/errors";
import { networkSubject, rateLimit } from "@/lib/rate-limit";
import { requestContext } from "@/lib/observability";

export const runtime = "nodejs";
type Context = { params: Promise<{ nextauth: string[] }> };

async function handle(request: NextRequest, context: Context) {
  const { nextauth } = await context.params;
  const trace = requestContext("auth");
  try {
    if (["signin", "callback"].includes(nextauth[0])) {
      await rateLimit(`auth:${networkSubject(request.headers)}`, 30, 900);
    }
    return await NextAuth(request, { params: { nextauth } }, authOptions());
  } catch (error) {
    const status = error instanceof AppError ? error.status : 503;
    trace.log(status, error);
    return Response.json(
      { error: "Autenticação indisponível.", requestId: trace.id },
      {
        status,
        headers: {
          "Cache-Control": "no-store",
          "X-Request-Id": trace.id,
          ...(error instanceof AppError ? error.headers : {}),
        },
      },
    );
  }
}

export { handle as GET, handle as POST };
