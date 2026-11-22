import Link from "next/link";
import Logo from "@/components/Logo";

// Barre du haut des pages connectées
export default function EnTete({ actif, peutPublier = true }: { actif?: "accueil" | "annonces"; peutPublier?: boolean }) {
  const lien = (href: string, nom: string, cle: "accueil" | "annonces") => (
    <Link
      href={href}
      aria-current={actif === cle ? "page" : undefined}
      className={`rounded-lg px-3 py-2 text-sm font-semibold ${actif === cle ? "bg-vert-clair text-vert-fonce" : "text-gris hover:text-encre"}`}
    >
      {nom}
    </Link>
  );

  return (
    <header className="sticky top-0 z-10 border-b border-[#e1e5e2] bg-fond/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Logo />
        <nav className="flex items-center gap-1">
          <span className="hidden sm:contents">
            {lien("/", "Accueil", "accueil")}
            {lien("/annonces", "Annonces", "annonces")}
          </span>
          {peutPublier && (
            <Link
              href="/annonces/nouvelle"
              className="ml-1 flex h-10 items-center gap-1.5 rounded-full bg-jaune px-4 text-sm font-extrabold text-encre"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Publier
            </Link>
          )}
        </nav>
      </div>
      {/* Sur téléphone : onglets sous le logo */}
      <div className="mx-auto flex max-w-5xl gap-1 px-3 pb-2 sm:hidden">
        {lien("/", "Accueil", "accueil")}
        {lien("/annonces", "Annonces", "annonces")}
      </div>
    </header>
  );
}
