import Link from "next/link";
import { redirect } from "next/navigation";
import EnTete from "@/components/EnTete";
import { lireSession } from "@/lib/session";
import { ilYa } from "@/lib/format";
import { urlPhoto } from "@/lib/photos";

export const dynamic = "force-dynamic";

type Personne = { prenom: string; nom: string } | null;
type Conv = {
  id: string;
  demandeur_id: string;
  proprietaire_id: string;
  dernier_message_le: string;
  annonces: { titre: string; photos: string[] } | null;
  logements: { titre: string; photos: string[] } | null;
  demandeur: Personne;
  proprietaire: Personne;
};
type Msg = { conversation_id: string; texte: string; expediteur_id: string; lu: boolean; created_at: string };

export default async function Messages() {
  const { supabase, user, profil } = await lireSession();
  if (!user || !profil) redirect("/connexion");
  if (profil.statut !== "verifie") redirect("/attente");

  const { data } = await supabase
    .from("conversations")
    .select(
      "id, demandeur_id, proprietaire_id, dernier_message_le, annonces(titre, photos), logements(titre, photos), demandeur:profiles!conversations_demandeur_id_fkey(prenom, nom), proprietaire:profiles!conversations_proprietaire_id_fkey(prenom, nom)"
    )
    .order("dernier_message_le", { ascending: false })
    .limit(100);
  const conversations = (data ?? []) as unknown as Conv[];

  // Dernier message et nombre de non lus pour chaque conversation
  const derniers = new Map<string, Msg>();
  const nonLus = new Map<string, number>();
  if (conversations.length > 0) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("conversation_id, texte, expediteur_id, lu, created_at")
      .in("conversation_id", conversations.map((c) => c.id))
      .order("created_at", { ascending: false })
      .limit(1000);
    for (const m of (msgs ?? []) as Msg[]) {
      if (!derniers.has(m.conversation_id)) derniers.set(m.conversation_id, m);
      if (!m.lu && m.expediteur_id !== user.id) nonLus.set(m.conversation_id, (nonLus.get(m.conversation_id) ?? 0) + 1);
    }
  }

  return (
    <>
      <EnTete actif="messages" />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-5">
        <h1 className="text-2xl font-extrabold tracking-tight">Messages</h1>

        {conversations.length === 0 ? (
          <div className="rounded-2xl border border-[#e1e5e2] bg-white p-8 text-center text-gris">
            Aucune conversation pour l&apos;instant. Ouvre une annonce et clique sur « Envoyer un message ».
            <Link href="/annonces" className="mt-2 block font-bold text-vert">
              Voir les annonces
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col overflow-hidden rounded-2xl border border-[#e1e5e2] bg-white">
            {conversations.map((c) => {
              const autre = c.demandeur_id === user.id ? c.proprietaire : c.demandeur;
              const sujet = c.annonces ?? c.logements;
              const dernier = derniers.get(c.id);
              const n = nonLus.get(c.id) ?? 0;
              const photo = sujet?.photos?.[0];
              return (
                <li key={c.id} className="border-b border-[#eef0ee] last:border-b-0">
                  <Link href={`/messages/${c.id}`} className="flex items-center gap-3 p-3.5 hover:bg-fond">
                    <span className="h-14 w-14 flex-none overflow-hidden rounded-xl bg-[#dde7e1]">
                      {photo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={urlPhoto(photo)} alt="" className="h-full w-full object-cover" />
                      )}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={`truncate text-[15px] ${n ? "font-extrabold" : "font-bold"}`}>
                          {autre ? `${autre.prenom} ${autre.nom[0]}.` : "Étudiant"}
                        </span>
                        <span className="flex-none text-[11px] text-gris">{ilYa(dernier?.created_at ?? c.dernier_message_le)}</span>
                      </span>
                      <span className="truncate text-xs font-semibold text-vert">{sujet?.titre ?? "Annonce indisponible"}</span>
                      <span className="flex items-center justify-between gap-2">
                        <span className={`truncate text-[13px] ${n ? "font-semibold text-encre" : "text-gris"}`}>
                          {dernier ? `${dernier.expediteur_id === user.id ? "Toi : " : ""}${dernier.texte}` : "Pas encore de message"}
                        </span>
                        {n > 0 && (
                          <span className="flex h-5 min-w-5 flex-none items-center justify-center rounded-full bg-vert px-1.5 text-[11px] font-bold text-white">
                            {n}
                          </span>
                        )}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
