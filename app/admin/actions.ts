"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Valider ou refuser une carte (la fonction SQL vérifie elle-même que l'appelant est admin)
async function traiter(formData: FormData, accepte: boolean) {
  const userId = String(formData.get("user_id") ?? "");
  const motif = String(formData.get("motif") ?? "").trim() || "Photo illisible ou informations incorrectes.";

  const supabase = await createClient();
  const { error } = await supabase.rpc("traiter_verification", {
    p_user_id: userId,
    p_accepte: accepte,
    p_motif: accepte ? null : motif,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}

export async function validerCarte(formData: FormData) {
  await traiter(formData, true);
}

export async function refuserCarte(formData: FormData) {
  await traiter(formData, false);
}
