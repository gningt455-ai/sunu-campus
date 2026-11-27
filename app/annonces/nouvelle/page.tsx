import { redirect } from "next/navigation";
import EnTete from "@/components/EnTete";
import FormulaireAnnonce from "@/components/FormulaireAnnonce";
import { lireSession } from "@/lib/session";
import { lieuxEnBoutons, type Lieu } from "@/lib/lieux";

export const dynamic = "force-dynamic";

export default async function NouvelleAnnonce() {
  const { supabase, user, profil } = await lireSession();
  if (!user || !profil) redirect("/connexion");
  if (profil.statut !== "verifie") redirect("/attente");

  const [{ data: categories }, { data: lieux }, { data: dernier }] = await Promise.all([
    supabase.from("categories").select("id, nom, slug").order("ordre"),
    supabase.from("lieux").select("id, nom, type"),
    // Dernier lieu choisi par l'étudiant (proposé par défaut)
    supabase.from("annonces").select("lieu_id").eq("auteur_id", user.id).not("lieu_id", "is", null).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const listeLieux = (lieux ?? []) as Lieu[];
  const populaires = lieuxEnBoutons(listeLieux);

  return (
    <>
      <EnTete peutPublier={false} />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 py-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Nouvelle annonce</h1>
        <FormulaireAnnonce
          userId={user.id}
          categories={categories ?? []}
          lieux={listeLieux}
          lieuxPopulaires={populaires}
          dernierLieu={(dernier?.lieu_id as string | null) ?? ""}
        />
      </main>
    </>
  );
}
