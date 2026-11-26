import Link from "next/link";
import { redirect } from "next/navigation";
import EnTete from "@/components/EnTete";
import AlerteCarteTrouvee from "@/components/AlerteCarteTrouvee";
import { lireSession } from "@/lib/session";
import { ilYa } from "@/lib/format";
import { urlPhoto } from "@/lib/photos";
import { CATEGORIES_OBJET, cartesTrouveesPour, type CategorieObjet, type ResumeObjet } from "@/lib/objets";

export const dynamic = "force-dynamic";

type Filtres = Promise<{ sens?: string; categorie?: string; q?: string }>;

export default async function ObjetsPerdus({ searchParams }: { searchParams: Filtres }) {
  const { supabase, user, profil } = await lireSession();
  if (!user || !profil) redirect("/connexion");
  if (profil.statut === "bloque") redirect("/attente");

  const params = await searchParams;
  const sens = params.sens === "perdu" ? "perdu" : "trouve";
  const categorie = params.categorie && params.categorie in CATEGORIES_OBJET ? (params.categorie as CategorieObjet) : null;
  const recherche = (params.q ?? "").trim().replace(/[%_,()]/g, "").slice(0, 60);

  let requete = supabase
    .from("objets")
    .select("id, sens, categorie, titre, nom_sur_carte, lieu_texte, date_evenement, photo, statut, created_at, lieux(nom)")
    .eq("sens", sens)
    .eq("statut", "en_cours")
    .order("created_at", { ascending: false })
    .limit(60);
  if (categorie) requete = requete.eq("categorie", categorie);
  if (recherche) requete = requete.or(`nom_sur_carte.ilike.%${recherche}%,titre.ilike.%${recherche}%`);

  const [{ data }, mesCartes] = await Promise.all([requete, cartesTrouveesPour(supabase, profil.prenom, profil.nom)]);
  const objets = (data ?? []) as unknown as ResumeObjet[];

  const lien = (s: string, c: string | null) => {
    const p = new URLSearchParams({ sens: s });
    if (c) p.set("categorie", c);
    if (recherche) p.set("q", recherche);
    return `/objets?${p.toString()}`;
  };
  const puce = (actif: boolean) =>
    `flex-none rounded-full border px-4 py-2 text-[13px] font-semibold ${actif ? "border-encre bg-encre text-white" : "border-bord bg-white text-encre"}`;

  return (
    <>
      <EnTete actif="objets" peutPublier={profil.statut === "verifie"} />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight">Objets perdus</h1>
          {profil.statut === "verifie" && (
            <Link href="/objets/nouveau" className="rounded-full bg-jaune px-4 py-2 text-sm font-extrabold">
              + Déclarer
            </Link>
          )}
        </div>

        <AlerteCarteTrouvee objets={mesCartes} />

        {/* Trouvés / Perdus */}
        <div role="group" aria-label="Type d'annonce" className="grid grid-cols-2 gap-1.5 rounded-2xl bg-gris-clair p-1">
          {(["trouve", "perdu"] as const).map((s) => (
            <Link
              key={s}
              href={lien(s, categorie)}
              aria-current={sens === s ? "page" : undefined}
              className={`flex h-11 items-center justify-center rounded-xl text-sm font-bold ${sens === s ? "bg-white text-vert shadow-sm" : "text-gris"}`}
            >
              {s === "trouve" ? "Objets trouvés" : "Objets recherchés"}
            </Link>
          ))}
        </div>

        <form action="/objets" className="flex gap-2">
          <input type="hidden" name="sens" value={sens} />
          {categorie && <input type="hidden" name="categorie" value={categorie} />}
          <label className="flex h-12 flex-1 items-center gap-2 rounded-xl border border-[#e1e5e2] bg-white px-3">
            <span className="sr-only">Rechercher un nom ou un objet</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5c6b64" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </svg>
            <input name="q" type="search" defaultValue={recherche} placeholder="Ton nom, ou l'objet perdu…" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none" />
          </label>
          <button className="h-12 rounded-xl bg-vert px-4 text-sm font-bold text-white">Chercher</button>
        </form>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Catégories">
          <Link href={lien(sens, null)} className={puce(!categorie)}>
            Tout
          </Link>
          {Object.entries(CATEGORIES_OBJET).map(([cle, nom]) => (
            <Link key={cle} href={lien(sens, cle)} className={puce(categorie === cle)} aria-current={categorie === cle ? "page" : undefined}>
              {nom}
            </Link>
          ))}
        </div>

        {objets.length === 0 ? (
          <div className="rounded-2xl border border-[#e1e5e2] bg-white p-8 text-center text-gris">
            {recherche ? `Rien pour « ${recherche} » pour l'instant.` : "Aucune déclaration pour l'instant."}
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {objets.map((o) => (
              <li key={o.id}>
                <Link href={`/objets/${o.id}`} className="flex gap-3 rounded-2xl border border-[#e1e5e2] bg-white p-3 transition hover:shadow-md">
                  <span className="flex h-20 w-20 flex-none items-center justify-center overflow-hidden rounded-xl bg-[#dde7e1] text-center text-[11px] font-bold text-vert-fonce">
                    {o.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={urlPhoto(o.photo)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      CATEGORIES_OBJET[o.categorie]
                    )}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-gris">
                      {CATEGORIES_OBJET[o.categorie]} · {o.sens === "trouve" ? "Trouvé" : "Perdu"} {ilYa(o.created_at)}
                    </span>
                    <span className="truncate font-bold">{o.titre}</span>
                    {o.nom_sur_carte && <span className="truncate text-sm font-semibold text-vert">Au nom de : {o.nom_sur_carte}</span>}
                    {(o.lieux || o.lieu_texte) && <span className="truncate text-xs text-gris">Lieu : {o.lieux?.nom ?? o.lieu_texte}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
