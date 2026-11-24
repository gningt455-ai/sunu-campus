import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sunu-campus.vercel.app";

// Plan du site pour Google : uniquement les pages publiques
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/inscription`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/connexion`, changeFrequency: "monthly", priority: 0.5 },
  ];
}
