import { ZodError } from "zod";
import type { ApiScope } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { requestContext } from "@/lib/observability";
import { networkSubject, rateLimit } from "@/lib/rate-limit";
import { authorizeApiKey } from "@/modules/api-keys/service";

type Actor = Awaited<ReturnType<typeof authorizeApiKey>>;

export async function apiResponse(
  request: Request,
  operation: string,
  scope: ApiScope,
  work: (
    actor: Actor,
  ) => Promise<{
    data?: unknown;
    meta?: object;
    status?: number;
    headers?: Record<string, string>;
  }>,
) {
  const trace = requestContext(operation);
  const common = {
    "Cache-Control": "private, no-store",
    "X-Request-Id": trace.id,
  };
  let rate: Record<string, string> = {};
  try {
    await rateLimit(`api:network:${networkSubject(request.headers)}`, 600, 60);
    const key = await authorizeApiKey(
      request.headers.get("authorization"),
      scope,
    );
    rate = await rateLimit(`api:key:${key.id}`, 120, 60);
    const { data, meta, status = 200, headers: extra } = await work(key);
    trace.log(status);
    const headers = { ...common, ...rate, ...extra };
    return status === 204
      ? new Response(null, { status, headers })
      : Response.json({ data, ...(meta ? { meta } : {}) }, { status, headers });
  } catch (error) {
    const validation = error instanceof ZodError;
    const expected = error instanceof AppError ? error : undefined;
    const status = expected?.status ?? (validation ? 422 : 500);
    const code =
      expected?.code ?? (validation ? "VALIDATION_ERROR" : "INTERNAL_ERROR");
    const message =
      expected?.message ??
      (validation
        ? "Confira os dados enviados."
        : "Não foi possível concluir a operação.");
    trace.log(status, error);
    return Response.json(
      {
        error: {
          code,
          message,
          ...(validation
            ? {
                details: error.issues.map((issue) => ({
                  path: issue.path.join("."),
                  code: issue.code,
                })),
              }
            : {}),
        },
        requestId: trace.id,
      },
      { status, headers: { ...common, ...rate, ...expected?.headers } },
    );
  }
}

export function urlFilters(request: Request) {
  const params = new URL(request.url).searchParams;
  const values: Record<string, string> = Object.create(null);
  for (const [key, value] of params) {
    if (Object.hasOwn(values, key))
      throw new AppError(
        422,
        "DUPLICATE_FILTER",
        "Envie cada parâmetro apenas uma vez.",
      );
    values[key] = value;
  }
  return values;
}

export async function readJson(request: Request): Promise<unknown> {
  const limit = 16384;
  if (
    request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() !==
    "application/json"
  ) {
    throw new AppError(
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "Envie Content-Type application/json.",
    );
  }
  if (Number(request.headers.get("content-length")) > limit)
    throw new AppError(413, "PAYLOAD_TOO_LARGE", "O corpo excede 16 KiB.");
  const reader = request.body?.getReader();
  if (!reader)
    throw new AppError(400, "INVALID_JSON", "Envie um documento JSON.");
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0;
  let body = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        throw new AppError(413, "PAYLOAD_TOO_LARGE", "O corpo excede 16 KiB.");
      }
      body += decoder.decode(value, { stream: true });
    }
    return JSON.parse(body + decoder.decode()) as unknown;
  } catch (error) {
    if (error instanceof AppError) throw error;
    await reader.cancel().catch(() => {});
    throw new AppError(400, "INVALID_JSON", "Envie um documento JSON válido.");
  } finally {
    reader.releaseLock();
  }
}
