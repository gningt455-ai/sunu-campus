"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TYPES_LIEU } from "@/lib/lieux";

// Point par défaut (UCAD) : la carte a été retirée, la position exacte n'est plus utilisée
const POINT_UCAD = "SRID=4326;POINT(-17.4636 14.692)";

export async function ajouterLieu(formData: FormData) {
  const nom = String(formData.get("nom") ?? "").trim();
  const type = String(formData.get("type") ?? "autre");
  const description = String(formData.get("description") ?? "").trim();
  if (nom.length < 2) redirect("/admin/lieux?erreur=nom");
  if (!(type in TYPES_LIEU)) redirect("/admin/lieux?erreur=type");

  const supabase = await createClient();
  const { error } = await supabase.from("lieux").insert({ nom, type, description: description || null, geom: POINT_UCAD });
  if (error) redirect("/admin/lieux?erreur=enregistrement");

  revalidatePath("/admin/lieux");
  redirect(`/admin/lieux?ajoute=${encodeURIComponent(nom)}`);
}

export async function supprimerLieu(id: string) {
  const supabase = await createClient();
  // Les annonces et objets liés gardent leur fiche, sans lieu (« on delete set null »)
  const { error } = await supabase.from("lieux").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/lieux");
}
