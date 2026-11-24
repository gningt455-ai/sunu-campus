import Link from "next/link";
import { redirect } from "next/navigation";
import { Alerte } from "@/components/Champ";
import { lireSession } from "@/lib/session";
import { lieuxParType, TYPES_LIEU, type Lieu } from "@/lib/lieux";
import { ajouterLieu, supprimerLieu } from "./actions";

export const dynamic = "force-dynamic";

const ERREURS: Record<string, string> = {
  nom: "Indique le nom du lieu.",
  type: "Choisis le type de lieu.",
  enregistrement: "Le lieu n'a pas pu être ajouté. Vérifie qu'il n'existe pas déjà.",
};

export default async function AdminLieux({ searchParams }: { searchParams: Promise<{ ajoute?: string; erreur?: string }> }) {
  const { supabase, user, profil } = await lireSession();
  if (!user || !profil) redirect("/connexion");
  if (profil.role !== "admin" || profil.statut !== "verifie") redirect("/");

  const { ajoute, erreur } = await searchParams;
  const { data } = await supabase.from("lieux").select("id, nom, type");
  const groupes = lieuxParType((data ?? []) as Lieu[]);
  const total = data?.length ?? 0;

  return (
    <main className="flex flex-1 flex-col">
      <header className="bg-encre px-6 pb-6 pt-5 text-white">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          <Link href="/admin" className="text-sm font-semibold text-[#b8c4be] hover:text-white">
            ← Espace administrateur
          </Link>
          <h1 className="text-2xl font-extrabold">Lieux du campus ({total})</h1>
          <p className="text-sm text-[#b8c4be]">Ces lieux apparaissent dans les listes « lieu de rencontre » et « où as-tu trouvé / perdu ».</p>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-6">
        {ajoute && <Alerte type="succes">« {ajoute} » a été ajouté.</Alerte>}
        {erreur && <Alerte type="erreur">{ERREURS[erreur] ?? "Une erreur est survenue."}</Alerte>}

        <form action={ajouterLieu} className="flex flex-col gap-3 rounded-2xl border border-[#e1e5e2] bg-white p-4">
          <h2 className="text-lg font-extrabold">Ajouter un lieu</h2>
          <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
              Nom
              <input name="nom" required maxLength={80} placeholder="Ex. Pavillon K, Couloir de la mort…" className="h-12 rounded-xl border border-bord px-3 text-[15px] font-normal" />
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
              Type
              <select name="type" defaultValue="pavillon" className="h-12 rounded-xl border border-bord bg-white px-3 text-[15px] font-normal">
                {Object.entries(TYPES_LIEU).map(([cle, nom]) => (
                  <option key={cle} value={cle}>
                    {nom}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
            Description (facultatif)
            <input name="description" maxLength={200} placeholder="Ex. À côté de l'entrée principale" className="h-12 rounded-xl border border-bord px-3 text-[15px] font-normal" />
          </label>
          <button className="min-h-[48px] rounded-xl bg-vert font-bold text-white hover:bg-vert-fonce">Ajouter le lieu</button>
        </form>

        {groupes.map((g) => (
          <section key={g.type} className="flex flex-col gap-2">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-gris">
              {g.titre} ({g.lieux.length})
            </h2>
            <ul className="flex flex-col overflow-hidden rounded-2xl border border-[#e1e5e2] bg-white">
              {g.lieux.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 border-b border-[#eef0ee] px-4 py-2.5 last:border-b-0">
                  <span className="font-semibold">{l.nom}</span>
                  <details className="relative">
                    <summary className="cursor-pointer list-none rounded-lg px-2 py-1 text-xs font-bold text-rouge hover:bg-rouge-clair">Supprimer</summary>
                    <form action={supprimerLieu.bind(null, l.id)} className="absolute right-0 z-10 mt-1 w-48 rounded-lg border border-bord bg-white p-2 shadow-md">
                      <button className="h-9 w-full rounded-md bg-rouge text-xs font-bold text-white">Oui, supprimer</button>
                    </form>
                  </details>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
