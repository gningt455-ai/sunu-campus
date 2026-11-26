import type { ReactNode } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import BadgeMessages from "@/components/BadgeMessages";
import { lireSession } from "@/lib/session";

type Onglet = "accueil" | "annonces" | "objets" | "campus" | "messages" | "mur";

// Icônes simples (traits) de la barre du bas
const ICONES: Record<Onglet, ReactNode> = {
  accueil: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  annonces: (
    <>
      <path d="M3 7h18l-1.5 12.5a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5z" />
      <path d="M8 10V6a4 4 0 0 1 8 0v4" />
    </>
  ),
  objets: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </>
  ),
  messages: <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1z" />,
  mur: (
    <>
      <path d="M3 12c0-4 4-7 9-7s9 3 9 7-4 7-9 7c-1.2 0-2.4-.2-3.4-.5L4 20l1.2-3.6C3.8 15.2 3 13.7 3 12z" />
      <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" />
    </>
  ),
  campus: (
    <>
      <path d="M3 21h18M5 21V10l7-5 7 5v11" />
      <path d="M9 21v-6h6v6" />
    </>
  ),
};

// Barre du haut des pages connectées
export default async function EnTete({ actif, peutPublier = true }: { actif?: Onglet; peutPublier?: boolean }) {
  // Nombre de messages reçus non lus (la sécurité RLS limite aux conversations de l'étudiant).
  // lireSession() est mis en cache : aucune vérification supplémentaire.
  const { supabase, user } = await lireSession();
  let nonLus = 0;
  if (user) {
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("lu", false)
      .neq("expediteur_id", user.id);
    nonLus = count ?? 0;
  }

  const lien = (href: string, nom: string, cle: Onglet) => (
    <Link
      href={href}
      prefetch
      aria-current={actif === cle ? "page" : undefined}
      className={`inline-flex flex-none items-center rounded-lg px-3 py-2 text-sm font-semibold ${actif === cle ? "bg-vert-clair text-vert-fonce" : "text-gris hover:text-encre"}`}
    >
      {nom}
      {cle === "messages" && user && <BadgeMessages initial={nonLus} moi={user.id} />}
    </Link>
  );

  const ongletBas = (href: string, nom: string, cle: Onglet, icone: ReactNode) => (
    <Link
      href={href}
      prefetch
      aria-current={actif === cle ? "page" : undefined}
      className={`flex min-h-[58px] flex-col items-center justify-center gap-0.5 text-[10.5px] font-semibold ${actif === cle ? "text-vert" : "text-gris"}`}
    >
      <span className="relative">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={actif === cle ? 2.4 : 1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {icone}
        </svg>
        {cle === "messages" && user && (
          <BadgeMessages
            initial={nonLus}
            moi={user.id}
            className="absolute -right-2.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rouge px-1 text-[10px] font-bold leading-none text-white"
          />
        )}
      </span>
      {nom}
    </Link>
  );

  return (
    <>
    <header className="sticky top-0 z-10 w-full min-w-0 border-b border-[#e1e5e2] bg-fond/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Logo />
        <nav className="flex items-center gap-1">
          <span className="hidden sm:contents">
            {lien("/", "Accueil", "accueil")}
            {lien("/annonces", "Annonces", "annonces")}
            {lien("/objets", "Objets perdus", "objets")}
            {lien("/messages", "Messages", "messages")}
            {lien("/mur", "Anonyme", "mur")}
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
          <span className="hidden sm:contents">{lien("/campus", "Campus", "campus")}</span>
        </nav>
      </div>
    </header>
      {/* Sur téléphone : barre d'onglets fixe en bas, les 6 onglets visibles sans défiler */}
      <nav aria-label="Navigation principale" className="nav-bas fixed inset-x-0 bottom-0 z-20 border-t border-[#e1e5e2] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-md grid-cols-6">
          {ongletBas("/", "Accueil", "accueil", ICONES.accueil)}
          {ongletBas("/annonces", "Annonces", "annonces", ICONES.annonces)}
          {ongletBas("/objets", "Objets", "objets", ICONES.objets)}
          {ongletBas("/messages", "Messages", "messages", ICONES.messages)}
          {ongletBas("/mur", "Anonyme", "mur", ICONES.mur)}
          {ongletBas("/campus", "Campus", "campus", ICONES.campus)}
        </div>
      </nav>
    </>
  );
}
