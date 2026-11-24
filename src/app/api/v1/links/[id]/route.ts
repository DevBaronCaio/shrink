import { deleteLink, getLink, updateLink } from "@/modules/links/service";
import { apiResponse, readJson } from "@/modules/api/http";

export const runtime = "nodejs";
type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  return apiResponse(request, "api.links.get", "READ", async ({ userId }) => ({
    data: await getLink(userId, id),
  }));
}
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  return apiResponse(
    request,
    "api.links.update",
    "WRITE",
    async ({ userId }) => ({
      data: await updateLink(userId, id, await readJson(request)),
    }),
  );
}
export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  return apiResponse(
    request,
    "api.links.delete",
    "WRITE",
    async ({ userId }) => {
      await deleteLink(userId, id);
      return { status: 204 };
    },
  );
}
