import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sunucampus.com";

// Google peut visiter les pages publiques. Les pages réservées aux étudiants
// connectés (annonces, messages, admin…) n'ont rien à indexer.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/inscription", "/connexion"],
      disallow: ["/admin", "/messages", "/attente", "/mur", "/objets", "/annonces", "/campus", "/auth", "/nouveau-mot-de-passe"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
