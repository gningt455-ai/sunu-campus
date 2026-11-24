import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import EnTete from "@/components/EnTete";
import CartePublication from "@/components/CartePublication";
import { Alerte } from "@/components/Champ";
import { lireSession } from "@/lib/session";
import { estUuid, ilYa } from "@/lib/format";
import { MOTIFS_MUR, type Commentaire, type Publication } from "@/lib/mur";
import { commenter, signaler, supprimerCommentaire } from "../actions";

export const dynamic = "force-dynamic";

export default async function PagePublication({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erreur?: string; signale?: string }>;
}) {
  const { id } = await params;
  const { erreur, signale } = await searchParams;
  if (!estUuid(id)) notFound();

  const { supabase, user, profil } = await lireSession();
  if (!user || !profil) redirect("/connexion");
  if (profil.statut !== "verifie") redirect("/attente");

  const [{ data: pub }, { data: coms }] = await Promise.all([
    supabase.from("mur").select("id, categorie, texte, created_at, nb_reactions, nb_commentaires, j_aime, est_a_moi").eq("id", id).maybeSingle(),
    supabase.from("mur_commentaires").select("id, publication_id, texte, created_at, est_a_moi").eq("publication_id", id).order("created_at", { ascending: true }),
  ]);
  if (!pub) notFound();
  const p = pub as Publication;
  const commentaires = (coms ?? []) as Commentaire[];
  const retour = `/mur/${id}`;

  return (
    <>
      <EnTete actif="mur" />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-5">
        <Link href="/mur" className="text-sm font-semibold text-gris hover:text-encre">
          ← Tous les messages anonymes
        </Link>

        {signale && <Alerte type="succes">Merci, ton signalement a été envoyé à l&apos;équipe de modération.</Alerte>}
        {erreur && (
          <Alerte type="erreur">{erreur === "interdit" ? "Ta réponse contient un mot interdit par la charte." : "Ta réponse n'a pas pu être envoyée."}</Alerte>
        )}

        <CartePublication p={p} retour={retour} detail />

        <section id="commentaires" className="flex flex-col gap-3">
          <h2 className="text-lg font-extrabold">
            {commentaires.length} réponse{commentaires.length > 1 ? "s" : ""}
          </h2>

          {commentaires.map((c) => (
            <div key={c.id} className="flex flex-col gap-1.5 rounded-xl border border-[#e1e5e2] bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-gris">
                  {c.est_a_moi ? "Toi" : "Anonyme"} · {ilYa(c.created_at)}
                </span>
                {c.est_a_moi ? (
                  <form action={supprimerCommentaire.bind(null, c.id, id)}>
                    <button className="rounded-md px-2 py-1 text-xs font-semibold text-gris hover:bg-fond hover:text-rouge">Supprimer</button>
                  </form>
                ) : (
                  <details className="relative">
                    <summary className="cursor-pointer list-none rounded-md px-2 py-1 text-xs font-semibold text-gris hover:bg-fond">Signaler</summary>
                    <form action={signaler.bind(null, "commentaire", c.id, retour)} className="absolute right-0 z-10 mt-1 flex w-56 flex-col gap-2 rounded-lg border border-bord bg-white p-2 shadow-md">
                      <select name="motif" aria-label="Motif" className="h-10 rounded-md border border-bord bg-white px-2 text-sm">
                        {MOTIFS_MUR.map((m) => (
                          <option key={m}>{m}</option>
                        ))}
                      </select>
                      <button className="h-9 rounded-md bg-rouge text-xs font-bold text-white">Signaler</button>
                    </form>
                  </details>
                )}
              </div>
              <p className="whitespace-pre-line text-[15px] leading-relaxed">{c.texte}</p>
            </div>
          ))}

          <form action={commenter.bind(null, id)} className="flex flex-col gap-2 rounded-2xl border border-[#e1e5e2] bg-white p-3">
            <label className="sr-only" htmlFor="commentaire">
              Ton commentaire
            </label>
            <textarea
              id="commentaire"
              name="texte"
              rows={2}
              maxLength={500}
              required
              placeholder="Réponds anonymement…"
              className="w-full resize-none rounded-xl bg-fond p-3 text-[15px] outline-none focus:ring-2 focus:ring-vert/20"
            />
            <button className="min-h-[44px] rounded-xl bg-vert text-sm font-bold text-white hover:bg-vert-fonce">Répondre anonymement</button>
          </form>
        </section>
      </main>
    </>
  );
}
