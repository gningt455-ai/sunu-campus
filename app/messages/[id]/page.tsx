import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Conversation, { type Message } from "@/components/Conversation";
import { lireSession } from "@/lib/session";
import { estUuid, formatPrix } from "@/lib/format";
import { urlPhoto } from "@/lib/photos";

export const dynamic = "force-dynamic";

type Personne = { prenom: string; nom: string; faculte: string | null } | null;
type Conv = {
  id: string;
  annonce_id: string | null;
  demandeur_id: string;
  proprietaire_id: string;
  annonces: { id: string; titre: string; prix: number; photos: string[]; statut: string } | null;
  objets: { id: string; titre: string; photo: string | null; statut: string; sens: string } | null;
  demandeur: Personne;
  proprietaire: Personne;
};

export default async function PageConversation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!estUuid(id)) notFound();

  const { supabase, user, profil } = await lireSession();
  if (!user || !profil) redirect("/connexion");
  if (profil.statut !== "verifie") redirect("/attente");

  const { data } = await supabase
    .from("conversations")
    .select(
      "id, annonce_id, demandeur_id, proprietaire_id, annonces(id, titre, prix, photos, statut), objets(id, titre, photo, statut, sens), demandeur:profiles!conversations_demandeur_id_fkey(prenom, nom, faculte), proprietaire:profiles!conversations_proprietaire_id_fkey(prenom, nom, faculte)"
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound(); // pas participant, ou conversation inexistante
  const c = data as unknown as Conv;

  const { data: msgs } = await supabase
    .from("messages")
    .select("id, expediteur_id, texte, created_at, lu")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .limit(300);

  const autre = c.demandeur_id === user.id ? c.proprietaire : c.demandeur;
  const initiales = autre ? `${autre.prenom[0] ?? ""}${autre.nom[0] ?? ""}`.toUpperCase() : "?";
  const sujet = c.annonces
    ? { lien: `/annonces/${c.annonces.id}`, titre: c.annonces.titre, prix: formatPrix(c.annonces.prix), photo: c.annonces.photos[0], vendue: c.annonces.statut === "vendue" }
    : c.objets
      ? {
          lien: `/objets/${c.objets.id}`,
          titre: c.objets.titre,
          prix: c.objets.sens === "trouve" ? "Objet trouvé" : "Objet perdu",
          photo: c.objets.photo ?? undefined,
          vendue: c.objets.statut === "rendu",
        }
      : null;

  return (
    <div className="flex h-dvh flex-col">
      <header className="border-b border-[#e1e5e2] bg-white">
        <div className="mx-auto flex max-w-2xl flex-col gap-2.5 px-3 py-3">
          <div className="flex items-center gap-2">
            <Link href="/messages" aria-label="Retour aux messages" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-fond">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </Link>
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-jaune text-sm font-extrabold">{initiales}</span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-bold">{autre ? `${autre.prenom} ${autre.nom}` : "Étudiant"}</span>
              <span className="truncate text-xs font-semibold text-vert">✓ Étudiant vérifié{autre?.faculte ? ` · ${autre.faculte}` : ""}</span>
            </span>
          </div>
          {sujet && (
            <Link href={sujet.lien} className="flex items-center gap-2.5 rounded-xl bg-fond p-2">
              <span className="h-11 w-11 flex-none overflow-hidden rounded-lg bg-[#dde7e1]">
                {sujet.photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={urlPhoto(sujet.photo)} alt="" className="h-full w-full object-cover" />
                )}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] font-semibold">{sujet.titre}</span>
                <span className="text-[13px] font-extrabold text-vert">{sujet.prix}</span>
              </span>
              <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${sujet.vendue ? "bg-gris-clair text-gris" : "bg-vert-clair text-vert-fonce"}`}>
                {sujet.vendue ? (c.objets ? "Rendu" : "Vendue") : c.objets ? "En cours" : "Disponible"}
              </span>
            </Link>
          )}
        </div>
      </header>

      <Conversation conversationId={c.id} moi={user.id} messagesInitiaux={(msgs ?? []) as Message[]} />
    </div>
  );
}
