"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { lireSession } from "@/lib/session";

async function session() {
  const s = await lireSession();
  if (!s.user) redirect("/connexion");
  return { supabase: s.supabase, userId: s.user.id };
}

// Ouvrir (ou retrouver) la conversation avec l'auteur de la déclaration
export async function contacterAuteur(objetId: string) {
  const { supabase } = await session();
  const { data, error } = await supabase.rpc("ouvrir_conversation_objet", { p_objet_id: objetId });
  if (error) throw new Error(error.message);
  redirect(`/messages/${data}`);
}

// Auteur : objet rendu / retrouvé, ou remis en recherche
export async function changerStatutObjet(objetId: string, statut: "rendu" | "en_cours") {
  const { supabase } = await session();
  const { error } = await supabase.from("objets").update({ statut }).eq("id", objetId);
  if (error) throw new Error(error.message);
  revalidatePath(`/objets/${objetId}`);
  revalidatePath("/objets");
}

export async function supprimerObjet(objetId: string) {
  const { supabase } = await session();
  const { data } = await supabase.from("objets").select("photo").eq("id", objetId).single();
  const { error } = await supabase.from("objets").delete().eq("id", objetId);
  if (error) throw new Error(error.message);
  if (data?.photo) await supabase.storage.from("photos").remove([data.photo]);
  revalidatePath("/objets");
  redirect("/objets");
}

export async function signalerObjet(objetId: string, formData: FormData) {
  const { supabase, userId } = await session();
  const motif = String(formData.get("motif") ?? "Autre");
  const { error } = await supabase.from("signalements").insert({
    auteur_id: userId,
    type_contenu: "objet",
    contenu_id: objetId,
    motif,
  });
  if (error && error.code !== "23505") throw new Error(error.message);
  redirect(`/objets/${objetId}?signale=1`);
}
