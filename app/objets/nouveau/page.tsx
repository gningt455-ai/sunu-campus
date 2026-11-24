import { redirect } from "next/navigation";
import EnTete from "@/components/EnTete";
import FormulaireObjet from "@/components/FormulaireObjet";
import { lireSession } from "@/lib/session";
import type { Lieu } from "@/lib/lieux";

export const dynamic = "force-dynamic";

export default async function DeclarerObjet({ searchParams }: { searchParams: Promise<{ sens?: string }> }) {
  const { supabase, user, profil } = await lireSession();
  if (!user || !profil) redirect("/connexion");
  if (profil.statut !== "verifie") redirect("/attente");

  const { sens } = await searchParams;
  const { data: lieux } = await supabase.from("lieux").select("id, nom, type");

  return (
    <>
      <EnTete actif="objets" />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 py-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Déclarer un objet</h1>
        <FormulaireObjet userId={user.id} lieux={(lieux ?? []) as Lieu[]} sensInitial={sens === "perdu" ? "perdu" : "trouve"} />
      </main>
    </>
  );
}
