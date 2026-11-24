import { createLink, listLinks } from "@/modules/links/service";
import { apiResponse, readJson, urlFilters } from "@/modules/api/http";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export function GET(request: Request) {
  return apiResponse(request, "api.links.list", "READ", async ({ userId }) => {
    const { items, ...meta } = await listLinks(userId, urlFilters(request));
    return { data: items, meta };
  });
}

export function POST(request: Request) {
  return apiResponse(
    request,
    "api.links.create",
    "WRITE",
    async ({ userId }) => {
      await rateLimit(`create:${userId}`, 30, 3600);
      const link = await createLink(userId, await readJson(request));
      return {
        data: link,
        status: 201,
        headers: { Location: `/api/v1/links/${link.id}` },
      };
    },
  );
}
