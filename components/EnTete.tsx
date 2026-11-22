import Link from "next/link";
import Logo from "@/components/Logo";
import BadgeMessages from "@/components/BadgeMessages";
import { createClient } from "@/lib/supabase/server";

type Onglet = "accueil" | "annonces" | "campus" | "messages";

// Barre du haut des pages connectées
export default async function EnTete({ actif, peutPublier = true }: { actif?: Onglet; peutPublier?: boolean }) {
  // Nombre de messages reçus non lus (la sécurité RLS limite aux conversations de l'étudiant)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
      aria-current={actif === cle ? "page" : undefined}
      className={`inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold ${actif === cle ? "bg-vert-clair text-vert-fonce" : "text-gris hover:text-encre"}`}
    >
      {nom}
      {cle === "messages" && user && <BadgeMessages initial={nonLus} moi={user.id} />}
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
            {lien("/campus", "Campus", "campus")}
            {lien("/messages", "Messages", "messages")}
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
        {lien("/campus", "Campus", "campus")}
        {lien("/messages", "Messages", "messages")}
      </div>
    </header>
  );
}
