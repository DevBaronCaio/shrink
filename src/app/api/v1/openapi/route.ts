import { openapi } from "@/modules/api/openapi";

export function GET() {
  return Response.json(openapi(), {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
