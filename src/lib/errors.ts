export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly headers?: Record<string, string>,
  ) {
    super(message);
  }
}

export function notFound() {
  return new AppError(404, "NOT_FOUND", "Recurso não encontrado.");
}
