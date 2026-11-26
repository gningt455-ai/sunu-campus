import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

// Adresse publique du site (à changer si tu prends un nom de domaine)
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sunucampus.com";

const description =
  "La plateforme des étudiants de l'UCAD : achète et vends entre étudiants, retrouve ta carte étudiant perdue, échange des messages anonymes et découvre le campus. Réservée aux étudiants vérifiés.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Sunu Campus — La plateforme des étudiants de l'UCAD",
    template: "%s · Sunu Campus",
  },
  description,
  applicationName: "Sunu Campus",
  keywords: [
    "UCAD",
    "Université Cheikh Anta Diop",
    "étudiants Dakar",
    "campus social",
    "carte étudiant perdue",
    "objets perdus UCAD",
    "annonces étudiants",
    "Sunu Campus",
  ],
  openGraph: {
    type: "website",
    locale: "fr_SN",
    url: SITE,
    siteName: "Sunu Campus",
    title: "Sunu Campus — La plateforme des étudiants de l'UCAD",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Sunu Campus — La plateforme des étudiants de l'UCAD",
    description,
  },
  // Code de vérification Google Search Console (variable d'environnement sur Vercel)
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
};

export const viewport: Viewport = {
  themeColor: "#0e6b4e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
