import { redirect } from "next/navigation";
import EnTete from "@/components/EnTete";
import FormulaireAnnonce from "@/components/FormulaireAnnonce";
import { lireSession } from "@/lib/session";
import type { Lieu } from "@/lib/lieux";

export const dynamic = "force-dynamic";

export default async function NouvelleAnnonce() {
  const { supabase, user, profil } = await lireSession();
  if (!user || !profil) redirect("/connexion");
  if (profil.statut !== "verifie") redirect("/attente");

  const [{ data: categories }, { data: lieux }] = await Promise.all([
    supabase.from("categories").select("id, nom").order("ordre"),
    supabase.from("lieux").select("id, nom, type"),
  ]);

  return (
    <>
      <EnTete peutPublier={false} />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 py-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Nouvelle annonce</h1>
        <FormulaireAnnonce userId={user.id} categories={categories ?? []} lieux={(lieux ?? []) as Lieu[]} />
      </main>
    </>
  );
}
