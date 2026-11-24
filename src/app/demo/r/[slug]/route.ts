import { demoLinks } from "@/modules/demo/data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const link = demoLinks.find((fixture) => fixture.slug === slug);
  const headers = {
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow",
  };
  return link
    ? new Response(null, {
        status: 302,
        headers: { ...headers, Location: link.destinationUrl },
      })
    : new Response("Link de demonstração indisponível.", {
        status: 404,
        headers,
      });
}
