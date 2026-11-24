import { getAnalytics } from "@/modules/analytics/service";
import { apiResponse, urlFilters } from "@/modules/api/http";

export const runtime = "nodejs";

export function GET(request: Request) {
  return apiResponse(request, "api.analytics", "READ", async ({ userId }) => ({
    data: await getAnalytics(userId, urlFilters(request)),
  }));
}
