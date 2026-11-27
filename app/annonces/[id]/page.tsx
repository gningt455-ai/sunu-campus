import { libelleEtat, type Disponibilite } from "@/lib/annonces";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import EnTete from "@/components/EnTete";
import { Alerte } from "@/components/Champ";
import { lireSession } from "@/lib/session";
import { estUuid, formatPrix, ilYa } from "@/lib/format";
import { urlPhoto } from "@/lib/photos";
import { basculerFavori, changerStatut, ouvrirConversation, signalerAnnonce, supprimerAnnonce } from "./actions";

export const dynamic = "force-dynamic";

type Annonce = {
  id: string;
  auteur_id: string;
  titre: string;
  description: string | null;
  prix: number;
  etat: "neuf" | "occasion";
  disponibilite: Disponibilite | null;
  statut: "en_ligne" | "vendue" | "masquee";
  photos: string[];
  created_at: string;
  categories: { nom: string; slug: string } | null;
  lieux: { nom: string; description: string | null } | null;
  profiles: { prenom: string; nom: string; faculte: string | null; niveau: string | null; statut: string } | null;
};

const MOTIFS = ["Arnaque", "Objet interdit", "Contenu choquant", "Fausse annonce", "Autre"];

export default async function DetailAnnonce({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ signale?: string }>;
}) {
  const { id } = await params;
  const { signale } = await searchParams;
  if (!estUuid(id)) notFound();

  const { supabase, user, profil } = await lireSession();
  if (!user || !profil) redirect("/connexion");
  if (profil.statut === "bloque") redirect("/attente");

  const { data } = await supabase
    .from("annonces")
    .select("id, auteur_id, titre, description, prix, etat, disponibilite, statut, photos, created_at, categories(nom, slug), lieux(nom, description), profiles(prenom, nom, faculte, niveau, statut)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const a = data as unknown as Annonce;

  const estAMoi = a.auteur_id === user.id;
  const verifie = profil.statut === "verifie";

  const [{ data: favori }, { count: nbAnnoncesVendeur }] = await Promise.all([
    supabase.from("favoris").select("id").eq("user_id", user.id).eq("annonce_id", a.id).maybeSingle(),
    supabase.from("annonces").select("id", { count: "exact", head: true }).eq("auteur_id", a.auteur_id).eq("statut", "en_ligne"),
  ]);

  const initiales = `${a.profiles?.prenom?.[0] ?? ""}${a.profiles?.nom?.[0] ?? ""}`.toUpperCase();

  return (
    <>
      <EnTete actif="annonces" peutPublier={verifie} />
      <main className="mx-auto grid w-full max-w-5xl flex-1 gap-6 px-4 py-5 md:grid-cols-[1.2fr_1fr]">
        {/* Photos : défilement horizontal, une photo par écran */}
        <section aria-label="Photos" className="flex flex-col gap-2">
          <Link href="/annonces" className="text-sm font-semibold text-gris hover:text-encre">
            ← Retour aux annonces
          </Link>
          <div className="relative">
          <div className={`flex snap-x snap-mandatory overflow-x-auto rounded-2xl bg-[#dde7e1] ${a.statut === "vendue" ? "grayscale" : ""}`}>
            {a.photos.length === 0 ? (
              <div className="flex aspect-[4/3] w-full flex-none items-center justify-center text-sm text-gris">Pas de photo</div>
            ) : (
              a.photos.map((p, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={p} src={urlPhoto(p)} alt={`Photo ${i + 1} sur ${a.photos.length}`} className="aspect-[4/3] w-full flex-none snap-center object-cover" />
              ))
            )}
          </div>
          {a.statut === "vendue" && (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-encre/35">
              <span className="-rotate-12 rounded-lg border-4 border-white bg-rouge px-6 py-2 text-3xl font-extrabold tracking-[0.2em] text-white shadow-lg">
                VENDU
              </span>
            </span>
          )}
          </div>
          {a.photos.length > 1 && <p className="text-center text-xs text-gris">Fais glisser pour voir les {a.photos.length} photos</p>}
        </section>

        <section className="flex flex-col gap-5">
          {signale && <Alerte type="succes">Merci, ton signalement a été envoyé à l&apos;équipe de modération.</Alerte>}
          {a.statut === "vendue" && (
            <Alerte type="info">{estAMoi ? "Tu as marqué cette annonce comme vendue. Elle reste visible 14 jours avec le bandeau VENDU." : "Cet article a déjà été vendu."}</Alerte>
          )}
          {a.statut === "masquee" && <Alerte type="erreur">Cette annonce a été masquée par la modération.</Alerte>}

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              {a.categories && (
                <Link href={`/annonces?categorie=${a.categories.slug}`} className="rounded-lg bg-vert-clair px-2.5 py-1 text-xs font-bold text-vert-fonce">
                  {a.categories.nom}
                </Link>
              )}
              {libelleEtat(a) && (
                <span className="rounded-lg bg-gris-clair px-2.5 py-1 text-xs font-bold text-[#36423d]">{libelleEtat(a)}</span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">{a.titre}</h1>
            <p className={`text-[26px] font-extrabold ${a.statut === "vendue" ? "text-gris line-through" : "text-vert"}`}>{formatPrix(a.prix)}</p>
            <p className="text-xs text-gris">Publiée {ilYa(a.created_at)}</p>
          </div>

          {a.description && <p className="whitespace-pre-line text-[15px] leading-relaxed text-[#36423d]">{a.description}</p>}

          <div className="flex items-center gap-3 rounded-2xl border border-[#e1e5e2] bg-white p-3.5">
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-jaune font-extrabold">{initiales}</span>
            <span className="flex flex-1 flex-col">
              <span className="font-bold">
                {a.profiles?.prenom} {a.profiles?.nom?.[0]}.
              </span>
              <span className="text-xs font-semibold text-vert">
                ✓ Étudiant vérifié{a.profiles?.faculte ? ` · ${a.profiles.faculte}` : ""}
              </span>
            </span>
            <span className="text-xs text-gris">
              {nbAnnoncesVendeur ?? 0} annonce{(nbAnnoncesVendeur ?? 0) > 1 ? "s" : ""}
            </span>
          </div>

          {a.lieux && (
            <div className="flex flex-col gap-1 rounded-2xl border border-[#e1e5e2] bg-white p-3.5">
              <span className="text-xs font-bold uppercase tracking-wide text-gris">Lieu de rencontre</span>
              <span className="font-bold">{a.lieux.nom}</span>
              {a.lieux.description && <span className="text-[13px] text-gris">{a.lieux.description}</span>}
            </div>
          )}

          {estAMoi ? (
            <div className="flex flex-col gap-2">
              <form action={changerStatut.bind(null, a.id, a.statut === "vendue" ? "en_ligne" : "vendue")}>
                <button className="min-h-[52px] w-full rounded-xl bg-vert font-bold text-white hover:bg-vert-fonce" disabled={a.statut === "masquee"}>
                  {a.statut === "vendue" ? "Remettre en ligne" : "Marquer comme vendue"}
                </button>
              </form>
              <details className="rounded-xl border border-bord bg-white">
                <summary className="flex min-h-[48px] cursor-pointer items-center justify-center font-bold text-rouge">Supprimer l&apos;annonce</summary>
                <form action={supprimerAnnonce.bind(null, a.id)} className="flex flex-col gap-2 p-3 pt-0">
                  <p className="text-center text-[13px] text-gris">L&apos;annonce et ses photos seront supprimées définitivement.</p>
                  <button className="min-h-[44px] rounded-lg bg-rouge font-bold text-white">Oui, supprimer</button>
                </form>
              </details>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                {a.statut === "vendue" ? (
                  <button disabled className="min-h-[52px] flex-1 cursor-not-allowed rounded-xl bg-gris-clair font-bold text-gris">
                    Article déjà vendu
                  </button>
                ) : verifie ? (
                  <form action={ouvrirConversation.bind(null, a.id)} className="flex-1">
                    <button className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-vert font-bold text-white hover:bg-vert-fonce">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
                      </svg>
                      Envoyer un message
                    </button>
                  </form>
                ) : (
                  <button disabled className="min-h-[52px] flex-1 cursor-not-allowed rounded-xl bg-vert font-bold text-white opacity-60">
                    Compte en attente de validation
                  </button>
                )}
                {verifie && (
                  <form action={basculerFavori.bind(null, a.id)}>
                    <button
                      aria-label={favori ? "Retirer des favoris" : "Ajouter aux favoris"}
                      aria-pressed={!!favori}
                      className="flex h-[52px] w-[52px] items-center justify-center rounded-xl border border-bord bg-white"
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill={favori ? "#b3261e" : "none"} stroke="#b3261e" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
                      </svg>
                    </button>
                  </form>
                )}
              </div>

              {verifie && !signale && (
                <details className="rounded-xl text-sm">
                  <summary className="cursor-pointer py-2 font-semibold text-rouge">Signaler cette annonce</summary>
                  <form action={signalerAnnonce.bind(null, a.id)} className="mt-2 flex gap-2">
                    <label className="sr-only" htmlFor="motif">
                      Motif
                    </label>
                    <select id="motif" name="motif" className="h-11 flex-1 rounded-lg border border-bord bg-white px-2">
                      {MOTIFS.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                    <button className="h-11 rounded-lg bg-rouge px-4 font-bold text-white">Envoyer</button>
                  </form>
                </details>
              )}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
