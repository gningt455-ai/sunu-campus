import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import EnTete from "@/components/EnTete";
import { Alerte } from "@/components/Champ";
import { lireSession } from "@/lib/session";
import { estUuid, ilYa } from "@/lib/format";
import { urlPhoto } from "@/lib/photos";
import { CATEGORIES_OBJET, type ResumeObjet } from "@/lib/objets";
import { changerStatutObjet, contacterAuteur, signalerObjet, supprimerObjet } from "./actions";

export const dynamic = "force-dynamic";

type Objet = ResumeObjet & {
  auteur_id: string;
  description: string | null;
  profiles: { prenom: string; nom: string; faculte: string | null } | null;
};

const MOTIFS = ["Fausse déclaration", "Photo d'une pièce d'identité", "Contenu choquant", "Autre"];

export default async function DetailObjet({
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
    .from("objets")
    .select(
      "id, auteur_id, sens, categorie, titre, nom_sur_carte, description, lieu_texte, date_evenement, photo, statut, created_at, lieux(nom), profiles(prenom, nom, faculte)"
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const o = data as unknown as Objet;

  const estAMoi = o.auteur_id === user.id;
  const verifie = profil.statut === "verifie";
  const trouve = o.sens === "trouve";
  const initiales = `${o.profiles?.prenom?.[0] ?? ""}${o.profiles?.nom?.[0] ?? ""}`.toUpperCase();
  const date = o.date_evenement ? new Date(o.date_evenement).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : null;

  return (
    <>
      <EnTete actif="objets" peutPublier={verifie} />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 py-5">
        <Link href={`/objets?sens=${o.sens}`} className="text-sm font-semibold text-gris hover:text-encre">
          ← Retour aux objets {trouve ? "trouvés" : "recherchés"}
        </Link>

        {signale && <Alerte type="succes">Merci, ton signalement a été envoyé à l&apos;équipe de modération.</Alerte>}
        {o.statut === "rendu" && <Alerte type="succes">{trouve ? "Cet objet a été rendu à son propriétaire." : "Cet objet a été retrouvé."}</Alerte>}
        {o.statut === "masque" && <Alerte type="erreur">Cette déclaration a été masquée par la modération.</Alerte>}

        {o.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={urlPhoto(o.photo)} alt={o.titre} className="aspect-[4/3] w-full rounded-2xl object-cover" />
        )}

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1.5">
            <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${trouve ? "bg-vert-clair text-vert-fonce" : "bg-jaune-clair text-[#6b4500]"}`}>
              {trouve ? "Trouvé" : "Perdu"}
            </span>
            <span className="rounded-lg bg-gris-clair px-2.5 py-1 text-xs font-bold text-[#36423d]">{CATEGORIES_OBJET[o.categorie]}</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">{o.titre}</h1>
          {o.nom_sur_carte && (
            <p className="text-lg font-bold text-vert">
              Au nom de : <span className="text-encre">{o.nom_sur_carte}</span>
            </p>
          )}
          <p className="text-xs text-gris">Déclaré {ilYa(o.created_at)}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-0.5 rounded-xl border border-[#e1e5e2] bg-white p-3">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gris">{trouve ? "Trouvé à" : "Perdu à"}</span>
            <span className="font-bold">{o.lieux?.nom ?? o.lieu_texte ?? "Non précisé"}</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-xl border border-[#e1e5e2] bg-white p-3">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gris">Date</span>
            <span className="font-bold first-letter:uppercase">{date ?? "Non précisée"}</span>
          </div>
        </div>

        {o.description && <p className="whitespace-pre-line text-[15px] leading-relaxed text-[#36423d]">{o.description}</p>}

        <div className="flex items-center gap-3 rounded-2xl border border-[#e1e5e2] bg-white p-3.5">
          <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-jaune font-extrabold">{initiales}</span>
          <span className="flex flex-col">
            <span className="font-bold">
              {o.profiles?.prenom} {o.profiles?.nom?.[0]}.
            </span>
            <span className="text-xs font-semibold text-vert">✓ Étudiant vérifié{o.profiles?.faculte ? ` · ${o.profiles.faculte}` : ""}</span>
          </span>
        </div>

        {estAMoi ? (
          <div className="flex flex-col gap-2">
            <form action={changerStatutObjet.bind(null, o.id, o.statut === "rendu" ? "en_cours" : "rendu")}>
              <button className="min-h-[52px] w-full rounded-xl bg-vert font-bold text-white hover:bg-vert-fonce" disabled={o.statut === "masque"}>
                {o.statut === "rendu" ? "Remettre en recherche" : trouve ? "Objet rendu à son propriétaire" : "J'ai retrouvé mon objet"}
              </button>
            </form>
            <details className="rounded-xl border border-bord bg-white">
              <summary className="flex min-h-[48px] cursor-pointer items-center justify-center font-bold text-rouge">Supprimer la déclaration</summary>
              <form action={supprimerObjet.bind(null, o.id)} className="flex flex-col gap-2 p-3 pt-0">
                <button className="min-h-[44px] rounded-lg bg-rouge font-bold text-white">Oui, supprimer</button>
              </form>
            </details>
          </div>
        ) : o.statut === "en_cours" ? (
          <div className="flex flex-col gap-3">
            {verifie ? (
              <form action={contacterAuteur.bind(null, o.id)}>
                <button className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-vert font-bold text-white hover:bg-vert-fonce">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
                  </svg>
                  {trouve ? "C'est à moi : contacter" : "Je l'ai trouvé : contacter"}
                </button>
              </form>
            ) : (
              <Alerte type="info">
                Ton compte est en attente de validation. Si c&apos;est ta carte, présente-toi au lieu indiqué avec une autre pièce d&apos;identité, ou
                demande à un ami vérifié de contacter {o.profiles?.prenom ?? "l'auteur"} pour toi.
              </Alerte>
            )}
            {trouve && o.nom_sur_carte && (
              <p className="text-xs leading-relaxed text-gris">
                Pour récupérer une carte, prépare-toi à prouver ton identité (une autre pièce, ou des informations que seul le propriétaire connaît).
              </p>
            )}
            {verifie && !signale && (
              <details className="rounded-xl text-sm">
                <summary className="cursor-pointer py-2 font-semibold text-rouge">Signaler cette déclaration</summary>
                <form action={signalerObjet.bind(null, o.id)} className="mt-2 flex gap-2">
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
        ) : null}
      </main>
    </>
  );
}
