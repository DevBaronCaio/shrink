import { randomUUID } from "node:crypto";

export function requestContext(operation: string) {
  const id = randomUUID();
  const started = performance.now();
  return {
    id,
    log(status: number, error?: unknown) {
      const details = {
        operation,
        requestId: id,
        status,
        durationMs: Math.round(performance.now() - started),
        ...(error instanceof Error ? { errorType: error.name } : {}),
      };
      const line = JSON.stringify(details);
      if (status >= 500) console.error(line);
      else if (process.env.NODE_ENV === "production") console.info(line);
    },
  };
}
