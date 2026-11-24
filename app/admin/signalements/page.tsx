import Link from "next/link";
import { redirect } from "next/navigation";
import { lireSession } from "@/lib/session";
import { ilYa } from "@/lib/format";
import { bloquerAuteur, traiterSignalement } from "./actions";

export const dynamic = "force-dynamic";

type Signalement = { id: string; type_contenu: string; contenu_id: string; motif: string; created_at: string };
type Auteur = { id: string; prenom: string; nom: string; statut: string };
type Contenu = { id: string; auteur_id: string; apercu: string; lien: string | null; statut: string };

const LIBELLES: Record<string, string> = {
  annonce: "Annonce",
  objet: "Objet perdu",
  publication: "Message anonyme",
  commentaire: "Réponse (message anonyme)",
  logement: "Logement",
  message: "Message",
  utilisateur: "Utilisateur",
};

export default async function AdminSignalements() {
  const { supabase, user, profil } = await lireSession();
  if (!user || !profil) redirect("/connexion");
  if (profil.role !== "admin" || profil.statut !== "verifie") redirect("/");

  const { data } = await supabase
    .from("signalements")
    .select("id, type_contenu, contenu_id, motif, created_at")
    .eq("statut", "en_attente")
    .order("created_at", { ascending: true })
    .limit(300);
  const signalements = (data ?? []) as Signalement[];

  // Regroupement : un même contenu peut être signalé par plusieurs étudiants
  const groupes = new Map<string, { type: string; contenuId: string; liste: Signalement[] }>();
  for (const s of signalements) {
    const cle = `${s.type_contenu}:${s.contenu_id}`;
    if (!groupes.has(cle)) groupes.set(cle, { type: s.type_contenu, contenuId: s.contenu_id, liste: [] });
    groupes.get(cle)!.liste.push(s);
  }

  // Aperçu des contenus signalés (l'admin peut lire les tables, y compris l'auteur des messages anonymes)
  const ids = (type: string) => [...groupes.values()].filter((g) => g.type === type).map((g) => g.contenuId);
  const contenus = new Map<string, Contenu>();
  const charger = async (type: string, table: string, colonnes: string, versContenu: (r: Record<string, string>) => Contenu) => {
    const liste = ids(type);
    if (liste.length === 0) return;
    const { data: lignes } = await supabase.from(table).select(colonnes).in("id", liste);
    for (const r of (lignes ?? []) as unknown as Record<string, string>[]) contenus.set(`${type}:${r.id}`, versContenu(r));
  };
  await Promise.all([
    charger("annonce", "annonces", "id, auteur_id, titre, statut", (r) => ({ id: r.id, auteur_id: r.auteur_id, apercu: r.titre, lien: `/annonces/${r.id}`, statut: r.statut })),
    charger("objet", "objets", "id, auteur_id, titre, nom_sur_carte, statut", (r) => ({
      id: r.id,
      auteur_id: r.auteur_id,
      apercu: r.nom_sur_carte ? `${r.titre} — au nom de ${r.nom_sur_carte}` : r.titre,
      lien: `/objets/${r.id}`,
      statut: r.statut,
    })),
    charger("publication", "publications", "id, auteur_id, texte, statut", (r) => ({ id: r.id, auteur_id: r.auteur_id, apercu: r.texte, lien: `/mur/${r.id}`, statut: r.statut })),
    charger("commentaire", "commentaires", "id, auteur_id, texte, publication_id, statut", (r) => ({
      id: r.id,
      auteur_id: r.auteur_id,
      apercu: r.texte,
      lien: `/mur/${r.publication_id}`,
      statut: r.statut,
    })),
  ]);

  // Noms des auteurs
  const auteursIds = [...new Set([...contenus.values()].map((c) => c.auteur_id))];
  const { data: auteurs } = auteursIds.length
    ? await supabase.from("profiles").select("id, prenom, nom, statut").in("id", auteursIds)
    : { data: [] };
  const nomAuteur = new Map<string, Auteur>(((auteurs ?? []) as Auteur[]).map((a) => [a.id, a]));

  const liste = [...groupes.values()].sort((a, b) => b.liste.length - a.liste.length);

  return (
    <main className="flex flex-1 flex-col">
      <header className="bg-encre px-6 pb-6 pt-5 text-white">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          <Link href="/admin" className="text-sm font-semibold text-[#b8c4be] hover:text-white">
            ← Espace administrateur
          </Link>
          <h1 className="text-2xl font-extrabold">Signalements ({liste.length})</h1>
          <p className="text-sm text-[#b8c4be]">Au bout de 3 signalements, un contenu est masqué automatiquement en attendant ta décision.</p>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-6">
        {liste.length === 0 && <p className="rounded-2xl border border-[#e1e5e2] bg-white p-8 text-center text-gris">Aucun signalement en attente.</p>}

        {liste.map((g) => {
          const c = contenus.get(`${g.type}:${g.contenuId}`);
          const auteur = c ? nomAuteur.get(c.auteur_id) : undefined;
          const anonyme = g.type === "publication" || g.type === "commentaire";
          const motifs = [...new Set(g.liste.map((s) => s.motif))];
          const premier = g.liste[0];
          return (
            <article key={`${g.type}:${g.contenuId}`} className="flex flex-col gap-3 rounded-2xl border border-[#e1e5e2] bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-md bg-gris-clair px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-[#36423d]">{LIBELLES[g.type] ?? g.type}</span>
                <span className="text-xs font-bold text-rouge">
                  {g.liste.length} signalement{g.liste.length > 1 ? "s" : ""} · {ilYa(premier.created_at)}
                </span>
              </div>

              {c ? (
                <>
                  <p className="whitespace-pre-line rounded-xl bg-fond p-3 text-[15px] leading-relaxed">{c.apercu}</p>
                  {(c.statut === "masquee" || c.statut === "masque") && <span className="text-xs font-semibold text-rouge">Masqué automatiquement</span>}
                </>
              ) : (
                <p className="text-sm text-gris">Contenu déjà supprimé.</p>
              )}

              <p className="text-[13px] text-gris">Motifs : {motifs.join(", ")}</p>

              {auteur && (
                <details className="text-[13px]">
                  <summary className="cursor-pointer font-semibold text-encre">{anonyme ? "Voir l'auteur (message anonyme)" : "Auteur"}</summary>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span>
                      {auteur.prenom} {auteur.nom} {auteur.statut === "bloque" && <strong className="text-rouge">(bloqué)</strong>}
                    </span>
                    {auteur.statut !== "bloque" && (
                      <form action={bloquerAuteur.bind(null, auteur.id)}>
                        <button className="rounded-md border border-rouge px-2 py-1 text-xs font-bold text-rouge">Bloquer ce compte</button>
                      </form>
                    )}
                  </div>
                </details>
              )}

              <div className="flex gap-2">
                <form action={traiterSignalement.bind(null, premier.id, true)} className="flex-1">
                  <button className="h-11 w-full rounded-lg bg-rouge text-sm font-bold text-white">Supprimer le contenu</button>
                </form>
                <form action={traiterSignalement.bind(null, premier.id, false)} className="flex-1">
                  <button className="h-11 w-full rounded-lg border border-bord bg-white text-sm font-bold">Ignorer</button>
                </form>
                {c?.lien && (
                  <Link href={c.lien} className="flex h-11 items-center rounded-lg border border-bord px-3 text-sm font-bold">
                    Voir
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
