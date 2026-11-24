import { getAnalytics } from "@/modules/analytics/service";
import { apiResponse, urlFilters } from "@/modules/api/http";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return apiResponse(
    request,
    "api.links.analytics",
    "READ",
    async ({ userId }) => ({
      data: await getAnalytics(userId, urlFilters(request), id),
    }),
  );
}
