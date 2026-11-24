import type { MetadataRoute } from "next";
import { appUrl } from "@/config/site";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/demo", "/docs", "/privacidade"].map((path) => ({
    url: `${appUrl()}${path}`,
  }));
}
