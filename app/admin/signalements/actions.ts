"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Supprimer (masquer) le contenu signalé, ou ignorer le signalement.
// Les fonctions SQL vérifient elles-mêmes que l'appelant est administrateur.
export async function traiterSignalement(signalementId: string, supprimer: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("traiter_signalement", { p_signalement_id: signalementId, p_supprimer: supprimer });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/signalements");
  revalidatePath("/admin");
}

export async function bloquerAuteur(userId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("bloquer_compte", { p_user_id: userId, p_bloquer: true });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/signalements");
}
