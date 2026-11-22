import Link from "next/link";
import { redirect } from "next/navigation";
import EnTete from "@/components/EnTete";
import CarteAnnonce, { type ResumeAnnonce } from "@/components/CarteAnnonce";
import { lireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type Filtres = Promise<{ categorie?: string; q?: string }>;

export default async function Annonces({ searchParams }: { searchParams: Filtres }) {
  const { supabase, user, profil } = await lireSession();
  if (!user || !profil) redirect("/connexion");
  if (profil.statut === "bloque") redirect("/attente");

  const { categorie, q } = await searchParams;
  const recherche = (q ?? "").trim().slice(0, 60);

  const { data: categories } = await supabase.from("categories").select("id, slug, nom").order("ordre");
  const catActive = categories?.find((c) => c.slug === categorie);

  let requete = supabase
    .from("annonces")
    .select("id, titre, prix, etat, statut, photos, lieux(nom, nom_court)")
    .eq("statut", "en_ligne")
    .order("created_at", { ascending: false })
    .limit(60);
  if (catActive) requete = requete.eq("categorie_id", catActive.id);
  if (recherche) requete = requete.ilike("titre", `%${recherche}%`);

  const { data } = await requete;
  const annonces = (data ?? []) as unknown as ResumeAnnonce[];

  const lienFiltre = (slug?: string) => {
    const p = new URLSearchParams();
    if (slug) p.set("categorie", slug);
    if (recherche) p.set("q", recherche);
    const s = p.toString();
    return s ? `/annonces?${s}` : "/annonces";
  };

  const puce = (actif: boolean) =>
    `flex-none rounded-full border px-4 py-2 text-[13px] font-semibold ${actif ? "border-encre bg-encre text-white" : "border-bord bg-white text-encre"}`;

  return (
    <>
      <EnTete actif="annonces" peutPublier={profil.statut === "verifie"} />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-5">
        <h1 className="text-2xl font-extrabold tracking-tight">Annonces</h1>

        <form action="/annonces" className="flex gap-2">
          {catActive && <input type="hidden" name="categorie" value={catActive.slug} />}
          <label className="flex h-12 flex-1 items-center gap-2 rounded-xl border border-[#e1e5e2] bg-white px-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5c6b64" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </svg>
            <span className="sr-only">Rechercher une annonce</span>
            <input name="q" type="search" defaultValue={recherche} placeholder="Livre, ventilateur, baskets…" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none" />
          </label>
          <button className="h-12 rounded-xl bg-vert px-4 text-sm font-bold text-white">Chercher</button>
        </form>

        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Catégories">
          <Link href={lienFiltre()} className={puce(!catActive)} aria-current={!catActive ? "page" : undefined}>
            Tout
          </Link>
          {categories?.map((c) => (
            <Link key={c.slug} href={lienFiltre(c.slug)} className={puce(catActive?.slug === c.slug)} aria-current={catActive?.slug === c.slug ? "page" : undefined}>
              {c.nom}
            </Link>
          ))}
        </div>

        <p className="text-[13px] text-gris">
          {annonces.length} annonce{annonces.length > 1 ? "s" : ""}
          {recherche ? ` pour « ${recherche} »` : ""}
        </p>

        {annonces.length === 0 ? (
          <div className="rounded-2xl border border-[#e1e5e2] bg-white p-8 text-center text-gris">
            Aucune annonce pour l&apos;instant.
            {profil.statut === "verifie" && (
              <Link href="/annonces/nouvelle" className="mt-2 block font-bold text-vert">
                Publier la première
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {annonces.map((a) => (
              <CarteAnnonce key={a.id} annonce={a} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
