import { ZodError } from "zod";
import { AppError } from "./errors";
import { requestContext } from "./observability";

export type ActionResult<T = undefined> =
  { ok: true; data: T } | { ok: false; message: string };

export async function actionResult<T>(
  operation: string,
  work: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await work() };
  } catch (error) {
    if (error instanceof AppError) return { ok: false, message: error.message };
    if (error instanceof ZodError) {
      const issue = error.issues[0];
      return {
        ok: false,
        message: issue ? issue.message : "Confira os campos informados.",
      };
    }
    requestContext(operation).log(500, error);
    return {
      ok: false,
      message: "Não foi possível concluir a operação. Tente novamente.",
    };
  }
}
