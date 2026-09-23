import type { MetadataRoute } from "next";

// Required for `output: "export"` — metadata routes must be forced static
// since there's no server at request time to compute them on demand.
export const dynamic = "force-static";

const BASE_URL = "https://adjustglow.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
