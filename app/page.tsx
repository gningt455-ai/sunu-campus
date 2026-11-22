import Link from "next/link";
import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import { lireSession } from "@/lib/session";
import { deconnexion } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function Accueil() {
  const { user, profil } = await lireSession();

  // Visiteur non connecté : page de présentation
  if (!user || !profil) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-10">
        <Logo />
        <div className="flex flex-col gap-3">
          <h1 className="text-[32px] font-extrabold leading-tight tracking-tight">
            Achète, vends et trouve un logement entre étudiants de l&apos;UCAD.
          </h1>
          <p className="text-[15px] leading-relaxed text-gris">
            Une plateforme réservée aux étudiants vérifiés : annonces, carte du campus, logements, messagerie et mur anonyme.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link href="/inscription" className="flex min-h-[52px] items-center justify-center rounded-xl bg-vert font-bold text-white">
            Créer mon compte
          </Link>
          <Link href="/connexion" className="flex min-h-[52px] items-center justify-center rounded-xl border border-bord bg-white font-bold">
            Se connecter
          </Link>
        </div>
      </main>
    );
  }

  // Compte pas encore vérifié
  if (profil.statut !== "verifie") redirect("/attente");

  // Compte vérifié : accueil provisoire (les annonces arrivent à l'étape suivante)
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <Logo />
        <form action={deconnexion}>
          <button type="submit" className="text-sm font-semibold text-gris hover:text-encre">
            Déconnexion
          </button>
        </form>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-vert">
          ✓ {profil.role === "admin" ? "Administrateur" : "Étudiant vérifié"} {profil.faculte ? `· ${profil.faculte}` : ""}
        </span>
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight">Salut {profil.prenom}, bienvenue sur Sunu Campus !</h1>
      </div>
      <div className="rounded-2xl border border-[#e1e5e2] bg-white p-5 text-[15px] leading-relaxed text-gris">
        Ton compte est actif. Les annonces, la carte du campus et la messagerie arrivent très bientôt.
      </div>
      {profil.role === "admin" && (
        <Link href="/admin" className="flex min-h-[52px] items-center justify-center rounded-xl bg-encre font-bold text-white">
          Espace administrateur
        </Link>
      )}
    </main>
  );
}
