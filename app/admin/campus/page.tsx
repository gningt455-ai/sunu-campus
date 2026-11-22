import Link from "next/link";
import { redirect } from "next/navigation";
import FormulaireHistoire from "@/components/FormulaireHistoire";
import { lireSession } from "@/lib/session";
import { urlPhoto } from "@/lib/photos";
import { basculerPublication, supprimerHistoire } from "./actions";

export const dynamic = "force-dynamic";

type Histoire = { id: string; titre: string; couverture: string; photos: string[]; publie: boolean; created_at: string };

export default async function AdminCampus() {
  const { supabase, user, profil } = await lireSession();
  if (!user || !profil) redirect("/connexion");
  if (profil.role !== "admin" || profil.statut !== "verifie") redirect("/");

  const { data } = await supabase
    .from("histoires")
    .select("id, titre, couverture, photos, publie, created_at")
    .order("created_at", { ascending: false });
  const histoires = (data ?? []) as Histoire[];

  return (
    <main className="flex flex-1 flex-col">
      <header className="bg-encre px-6 pb-6 pt-5 text-white">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          <Link href="/admin" className="text-sm font-semibold text-[#b8c4be] hover:text-white">
            ← Espace administrateur
          </Link>
          <h1 className="text-2xl font-extrabold">Découvrir le campus</h1>
          <p className="text-sm text-[#b8c4be]">Publie des histoires et des photos qui montrent la beauté de l&apos;UCAD.</p>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-6">
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-extrabold">Nouvelle histoire</h2>
          <FormulaireHistoire userId={user.id} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-extrabold">Histoires ({histoires.length})</h2>
          {histoires.length === 0 && <p className="text-sm text-gris">Aucune histoire pour l&apos;instant.</p>}
          {histoires.map((h) => (
            <article key={h.id} className="flex items-center gap-3 rounded-2xl border border-[#e1e5e2] bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={urlPhoto(h.couverture)} alt="" className="h-16 w-20 flex-none rounded-lg object-cover" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Link href={`/campus/${h.id}`} className="truncate font-bold hover:underline">
                  {h.titre}
                </Link>
                <span className={`w-fit rounded-md px-2 py-0.5 text-[11px] font-bold ${h.publie ? "bg-vert-clair text-vert-fonce" : "bg-jaune-clair text-[#6b4500]"}`}>
                  {h.publie ? "Publiée" : "Brouillon"}
                </span>
              </div>
              <div className="flex flex-none flex-col gap-1.5 sm:flex-row">
                <form action={basculerPublication.bind(null, h.id, !h.publie)}>
                  <button className="h-9 w-full rounded-lg border border-bord px-3 text-xs font-bold">{h.publie ? "Dépublier" : "Publier"}</button>
                </form>
                <details className="relative">
                  <summary className="flex h-9 cursor-pointer list-none items-center justify-center rounded-lg border border-bord px-3 text-xs font-bold text-rouge">Supprimer</summary>
                  <form action={supprimerHistoire.bind(null, h.id)} className="absolute right-0 z-10 mt-1 w-44 rounded-lg border border-bord bg-white p-2 shadow-md">
                    <button className="h-9 w-full rounded-md bg-rouge text-xs font-bold text-white">Oui, supprimer</button>
                  </form>
                </details>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
