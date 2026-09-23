import type { MetadataRoute } from "next";

// Required for `output: "export"` — metadata routes must be forced static
// since there's no server at request time to compute them on demand.
export const dynamic = "force-static";

const BASE_URL = "https://adjustglow.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: `${BASE_URL}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/livedemo`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/integritetspolicy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/personuppgiftsbitradesavtal`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
