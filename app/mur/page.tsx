import Link from "next/link";
import { redirect } from "next/navigation";
import EnTete from "@/components/EnTete";
import CartePublication from "@/components/CartePublication";
import IconeMasque from "@/components/IconeMasque";
import { Alerte } from "@/components/Champ";
import { lireSession } from "@/lib/session";
import { CATEGORIES_MUR, type CategorieMur, type Publication } from "@/lib/mur";
import { publier } from "./actions";

export const dynamic = "force-dynamic";

const ERREURS: Record<string, string> = {
  charte: "Coche la case pour accepter la charte avant de publier.",
  court: "Ton message est trop court.",
  categorie: "Choisis une catégorie.",
  interdit: "Ton message contient un mot interdit par la charte.",
  envoi: "Ton message n'a pas pu être publié. Réessaie.",
};

type Filtres = Promise<{ categorie?: string; tri?: string; erreur?: string; publie?: string; signale?: string }>;

export default async function MessagesAnonymes({ searchParams }: { searchParams: Filtres }) {
  const { supabase, user, profil } = await lireSession();
  if (!user || !profil) redirect("/connexion");
  if (profil.statut !== "verifie") redirect("/attente");

  const params = await searchParams;
  const categorie = params.categorie && params.categorie in CATEGORIES_MUR ? (params.categorie as CategorieMur) : null;
  const populaires = params.tri === "populaires";

  let requete = supabase.from("mur").select("id, categorie, texte, created_at, nb_reactions, nb_commentaires, j_aime, est_a_moi").limit(80);
  requete = populaires
    ? requete.order("nb_reactions", { ascending: false }).order("created_at", { ascending: false })
    : requete.order("created_at", { ascending: false });
  if (categorie) requete = requete.eq("categorie", categorie);
  const { data } = await requete;
  const publications = (data ?? []) as Publication[];

  const lien = (tri: boolean, cat: CategorieMur | null) => {
    const p = new URLSearchParams();
    if (tri) p.set("tri", "populaires");
    if (cat) p.set("categorie", cat);
    const s = p.toString();
    return s ? `/mur?${s}` : "/mur";
  };
  const retour = lien(populaires, categorie);

  return (
    <>
      <EnTete actif="mur" />

      {/* Bandeau d'accueil */}
      <section className="bg-encre text-white">
        <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-7">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-jaune text-encre">
              <IconeMasque taille={28} />
            </span>
            <div className="flex flex-col">
              <h1 className="text-2xl font-extrabold tracking-tight">Messages anonymes</h1>
              <p className="text-sm text-[#b8c4be]">Dis ce que tu penses, sans révéler ton nom.</p>
            </div>
          </div>

          {/* Écrire : le formulaire s'ouvre au clic */}
          <details open={!!params.erreur} className="group rounded-2xl bg-white text-encre">
            <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-center gap-2 rounded-2xl bg-jaune text-base font-extrabold text-encre group-open:rounded-b-none">
              <IconeMasque taille={20} />
              Écrire anonymement
            </summary>
            <form action={publier} className="flex flex-col gap-3 p-4">
              <label className="sr-only" htmlFor="texte">
                Ton message
              </label>
              <textarea
                id="texte"
                name="texte"
                rows={4}
                maxLength={1000}
                required
                placeholder="Pose une question ou pousse un coup de gueule…"
                className="w-full resize-none rounded-xl bg-fond p-3 text-[16px] outline-none focus:ring-2 focus:ring-vert/30"
              />
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Catégorie">
                {(Object.keys(CATEGORIES_MUR) as CategorieMur[]).map((c, i) => (
                  <label key={c} className="cursor-pointer">
                    <input type="radio" name="categorie" value={c} defaultChecked={i === 0} className="peer sr-only" />
                    <span
                      className={`block rounded-full border-2 border-transparent px-3 py-1.5 text-[13px] font-bold opacity-60 peer-checked:border-encre peer-checked:opacity-100 peer-focus-visible:ring-2 peer-focus-visible:ring-vert ${CATEGORIES_MUR[c].badge}`}
                    >
                      {CATEGORIES_MUR[c].nom}
                    </span>
                  </label>
                ))}
              </div>
              <label className="flex items-start gap-2.5 text-xs leading-relaxed text-gris">
                <input type="checkbox" name="charte" className="mt-0.5 h-4 w-4 flex-none accent-[#0e6b4e]" />
                Je ne nomme personne, je n&apos;insulte pas, je ne harcèle pas. Les abus entraînent le blocage du compte.
              </label>
              {params.erreur && <Alerte type="erreur">{ERREURS[params.erreur] ?? ERREURS.envoi}</Alerte>}
              <button className="min-h-[48px] rounded-xl bg-vert font-bold text-white hover:bg-vert-fonce">Publier anonymement</button>
            </form>
          </details>
          <p className="text-xs text-[#b8c4be]">Ton nom n&apos;est jamais affiché. Seule la modération peut retrouver l&apos;auteur en cas d&apos;abus.</p>
        </div>
      </section>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-5">
        {params.publie && <Alerte type="succes">Ton message est publié anonymement.</Alerte>}
        {params.signale && <Alerte type="succes">Merci, ton signalement a été envoyé à l&apos;équipe de modération.</Alerte>}

        {/* Récents / Populaires */}
        <div role="group" aria-label="Tri" className="grid grid-cols-2 gap-1.5 rounded-2xl bg-gris-clair p-1">
          {[false, true].map((tri) => (
            <Link
              key={String(tri)}
              href={lien(tri, categorie)}
              aria-current={populaires === tri ? "page" : undefined}
              className={`flex h-11 items-center justify-center rounded-xl text-sm font-bold ${populaires === tri ? "bg-white text-encre shadow-sm" : "text-gris"}`}
            >
              {tri ? "Populaires" : "Récents"}
            </Link>
          ))}
        </div>

        {/* Catégories */}
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Catégories">
          <Link
            href={lien(populaires, null)}
            className={`flex-none rounded-full border px-4 py-2 text-[13px] font-semibold ${!categorie ? "border-encre bg-encre text-white" : "border-bord bg-white"}`}
          >
            Tout
          </Link>
          {(Object.keys(CATEGORIES_MUR) as CategorieMur[]).map((c) => (
            <Link
              key={c}
              href={lien(populaires, c)}
              aria-current={categorie === c ? "page" : undefined}
              className={`flex-none rounded-full px-4 py-2 text-[13px] font-bold ${categorie === c ? CATEGORIES_MUR[c].badge : `border ${CATEGORIES_MUR[c].carte}`}`}
            >
              {CATEGORIES_MUR[c].nom}
            </Link>
          ))}
        </div>

        {publications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-[#e1e5e2] bg-white p-10 text-center text-gris">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-fond text-encre">
              <IconeMasque taille={30} />
            </span>
            Aucun message pour l&apos;instant. Sois le premier à écrire anonymement !
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {publications.map((p) => (
              <CartePublication key={p.id} p={p} retour={retour} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
