import { auth } from "@/modules/auth/auth";
import { accountData } from "@/modules/users/export";
import { AppError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { requestContext } from "@/lib/observability";

export async function GET() {
  const trace = requestContext("account.export");
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
    await rateLimit(`account-export:${user.id}`, 5, 3600);
    const data = accountData(user.id);
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const item = await data.next();
          if (item.done) controller.close();
          else
            controller.enqueue(
              encoder.encode(JSON.stringify(item.value) + "\n"),
            );
        } catch (error) {
          trace.log(500, error);
          controller.error(error);
        }
      },
      async cancel() {
        await data.return(undefined);
      },
    });
    return new Response(stream, {
      headers: {
        ...headers,
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Content-Disposition": 'attachment; filename="shrink-account.ndjson"',
      },
    });
  } catch (error) {
    const status = error instanceof AppError ? error.status : 500;
    trace.log(status, error);
    return Response.json(
      {
        error:
          error instanceof AppError
            ? error.message
            : "Não foi possível exportar a conta.",
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
