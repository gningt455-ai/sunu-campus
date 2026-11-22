"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Publier / dépublier une histoire (la sécurité RLS réserve cette action à l'admin)
export async function basculerPublication(id: string, publie: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("histoires").update({ publie }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/campus");
  revalidatePath("/campus");
}

// Supprimer une histoire et ses photos
export async function supprimerHistoire(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("histoires").select("couverture, photos").eq("id", id).single();
  const { error } = await supabase.from("histoires").delete().eq("id", id);
  if (error) throw new Error(error.message);
  if (data) await supabase.storage.from("photos").remove([data.couverture, ...(data.photos ?? [])]);
  revalidatePath("/admin/campus");
  revalidatePath("/campus");
}
