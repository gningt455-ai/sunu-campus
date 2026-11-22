import Link from "next/link";
import { redirect } from "next/navigation";
import { lireSession } from "@/lib/session";
import { refuserCarte, validerCarte } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

type Demande = {
  user_id: string;
  numero_carte: string;
  photo_carte_path: string;
  created_at: string;
  updated_at: string;
  profiles: { prenom: string; nom: string; faculte: string | null; niveau: string | null; statut: string } | null;
};

function ilYa(date: string) {
  const minutes = Math.round((Date.now() - new Date(date).getTime()) / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  if (minutes < 1440) return `il y a ${Math.round(minutes / 60)} h`;
  return `il y a ${Math.round(minutes / 1440)} j`;
}

export default async function Admin() {
  const { supabase, user, profil } = await lireSession();
  if (!user || !profil) redirect("/connexion");
  if (profil.role !== "admin" || profil.statut !== "verifie") redirect("/");

  // Cartes pas encore traitées
  const { data } = await supabase
    .from("verifications")
    .select("user_id, numero_carte, photo_carte_path, created_at, updated_at, profiles!verifications_user_id_fkey(prenom, nom, faculte, niveau, statut)")
    .is("traite_le", null)
    .order("updated_at", { ascending: true });

  const demandes = (data ?? []) as unknown as Demande[];

  // Liens temporaires (10 min) vers les photos du bucket privé
  const liens = new Map<string, string>();
  if (demandes.length > 0) {
    const { data: signes } = await supabase.storage
      .from("cartes")
      .createSignedUrls(demandes.map((d) => d.photo_carte_path), 600);
    signes?.forEach((s) => s.path && s.signedUrl && liens.set(s.path, s.signedUrl));
  }

  return (
    <main className="flex flex-1 flex-col">
      <header className="bg-encre px-6 pb-6 pt-5 text-white">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <Link href="/" className="text-sm font-semibold text-[#b8c4be] hover:text-white">
            ← Retour à l&apos;accueil
          </Link>
          <h1 className="text-2xl font-extrabold">Espace administrateur</h1>
          <div className="w-fit rounded-xl bg-white px-4 py-3 text-encre">
            <span className="block text-2xl font-extrabold">{demandes.length}</span>
            <span className="text-xs font-semibold">Cartes à vérifier</span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-6">
        {demandes.length === 0 && (
          <p className="rounded-2xl border border-[#e1e5e2] bg-white p-8 text-center text-gris">Toutes les cartes ont été traitées.</p>
        )}

        {demandes.map((d) => {
          const lien = liens.get(d.photo_carte_path);
          return (
            <article key={d.user_id} className="flex flex-col gap-4 rounded-2xl border border-[#e1e5e2] bg-white p-4 sm:flex-row">
              <a
                href={lien}
                target="_blank"
                rel="noreferrer"
                className="flex h-40 w-full flex-none items-center justify-center overflow-hidden rounded-xl bg-[#e6eef8] sm:w-64"
              >
                {lien ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={lien} alt={`Carte de ${d.profiles?.prenom ?? "l'étudiant"}`} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-[#183e70]">Photo indisponible</span>
                )}
              </a>

              <div className="flex flex-1 flex-col gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-lg font-bold">
                    {d.profiles?.prenom} {d.profiles?.nom}
                  </span>
                  <span className="text-sm text-gris">
                    {d.profiles?.faculte ?? "Faculté non indiquée"} {d.profiles?.niveau ? `· ${d.profiles.niveau}` : ""}
                  </span>
                  <span className="text-sm text-gris">N° de carte : {d.numero_carte}</span>
                  <span className="text-xs text-gris">Envoyée {ilYa(d.updated_at)}</span>
                </div>

                <form className="flex flex-col gap-2">
                  <input type="hidden" name="user_id" value={d.user_id} />
                  <label className="flex flex-col gap-1 text-xs font-semibold text-gris">
                    Motif en cas de refus (facultatif)
                    <input
                      name="motif"
                      placeholder="Ex. photo floue, nom différent…"
                      className="h-10 rounded-lg border border-bord px-3 text-sm font-normal text-encre"
                    />
                  </label>
                  <div className="flex gap-2">
                    <button formAction={validerCarte} className="h-11 flex-1 rounded-lg bg-vert text-sm font-bold text-white hover:bg-vert-fonce">
                      Valider
                    </button>
                    <button formAction={refuserCarte} className="h-11 flex-1 rounded-lg border border-bord bg-white text-sm font-bold text-rouge">
                      Refuser
                    </button>
                  </div>
                </form>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
