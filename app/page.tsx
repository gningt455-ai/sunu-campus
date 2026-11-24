import Link from "next/link";
import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import EnTete from "@/components/EnTete";
import CarteAnnonce, { type ResumeAnnonce } from "@/components/CarteAnnonce";
import AlerteCarteTrouvee from "@/components/AlerteCarteTrouvee";
import { cartesTrouveesPour } from "@/lib/objets";
import { lireSession } from "@/lib/session";
import { deconnexion } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function Accueil() {
  const { supabase, user, profil } = await lireSession();

  // Visiteur non connecté : page de présentation
  if (!user || !profil) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-10">
        <Logo />
        <div className="flex flex-col gap-3">
          <h1 className="text-[32px] font-extrabold leading-tight tracking-tight">
            Achète, vends et retrouve tes objets perdus entre étudiants de l&apos;UCAD.
          </h1>
          <p className="text-[15px] leading-relaxed text-gris">
            Une plateforme réservée aux étudiants vérifiés : annonces, objets perdus, messagerie, messages anonymes et histoires du campus.
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

  // Compte vérifié : accueil avec catégories et dernières annonces
  const [{ data: categories }, { data: dernieres }, mesCartes] = await Promise.all([
    supabase.from("categories").select("slug, nom").order("ordre"),
    supabase
      .from("annonces")
      .select("id, titre, prix, etat, statut, photos, lieux(nom, nom_court)")
      .eq("statut", "en_ligne")
      .order("created_at", { ascending: false })
      .limit(8),
    cartesTrouveesPour(supabase, profil.prenom, profil.nom),
  ]);
  const annonces = (dernieres ?? []) as unknown as ResumeAnnonce[];

  return (
    <>
      <EnTete actif="accueil" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-vert">
            ✓ {profil.role === "admin" ? "Administrateur" : "Étudiant vérifié"}
            {profil.faculte ? ` · ${profil.faculte}` : ""}
          </span>
          <h1 className="text-[26px] font-extrabold leading-tight tracking-tight">Salut {profil.prenom}, tu cherches quoi aujourd&apos;hui ?</h1>
        </div>

        <AlerteCarteTrouvee objets={mesCartes} />

        <form action="/annonces" className="flex gap-2">
          <label className="flex h-12 flex-1 items-center gap-2 rounded-xl border border-[#e1e5e2] bg-white px-3">
            <span className="sr-only">Rechercher</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5c6b64" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </svg>
            <input name="q" type="search" placeholder="Livre, ventilateur, baskets…" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none" />
          </label>
        </form>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories?.map((c) => (
            <Link key={c.slug} href={`/annonces?categorie=${c.slug}`} className="flex-none rounded-full border border-bord bg-white px-4 py-2 text-[13px] font-semibold">
              {c.nom}
            </Link>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/objets" className="flex items-center justify-between gap-4 rounded-2xl bg-vert p-5 text-white">
            <span className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-jaune">Objets perdus</span>
              <span className="text-lg font-extrabold leading-snug">Carte étudiant perdue ? Vérifie si quelqu&apos;un l&apos;a trouvée</span>
            </span>
            <span aria-hidden="true" className="text-2xl">→</span>
          </Link>
          <Link href="/campus" className="flex items-center justify-between gap-4 rounded-2xl bg-encre p-5 text-white">
            <span className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-jaune">Découvrir le campus</span>
              <span className="text-lg font-extrabold leading-snug">La beauté de l&apos;UCAD et du campus social</span>
            </span>
            <span aria-hidden="true" className="text-2xl">→</span>
          </Link>
        </div>

        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-extrabold">Dernières annonces</h2>
            <Link href="/annonces" className="text-[13px] font-semibold text-vert">
              Tout voir
            </Link>
          </div>
          {annonces.length === 0 ? (
            <div className="rounded-2xl border border-[#e1e5e2] bg-white p-8 text-center text-gris">
              Aucune annonce pour l&apos;instant.
              <Link href="/annonces/nouvelle" className="mt-2 block font-bold text-vert">
                Publie la première !
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {annonces.map((a) => (
                <CarteAnnonce key={a.id} annonce={a} />
              ))}
            </div>
          )}
        </section>

        <div className="mt-auto flex flex-col gap-2 pt-4">
          {profil.role === "admin" && (
            <Link href="/admin" className="flex min-h-[52px] items-center justify-center rounded-xl bg-encre font-bold text-white">
              Espace administrateur
            </Link>
          )}
          <form action={deconnexion}>
            <button type="submit" className="w-full py-3 text-sm font-semibold text-gris hover:text-encre">
              Se déconnecter
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
