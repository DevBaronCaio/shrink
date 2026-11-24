import type { MetadataRoute } from "next";
import { appUrl } from "@/config/site";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/api/", "/r/"],
    },
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
