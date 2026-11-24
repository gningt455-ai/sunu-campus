import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    // Navigation rapide : une page déjà visitée ou préchargée est réaffichée
    // instantanément pendant 30 s (pages dynamiques) / 60 s (liens préchargés).
    // Après une action (publier, envoyer…), revalidatePath() rafraîchit les données.
    staleTimes: {
      dynamic: 30,
      static: 60,
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
