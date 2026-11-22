"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { lireSession } from "@/lib/session";

async function session() {
  const s = await lireSession();
  if (!s.user) redirect("/connexion");
  return { supabase: s.supabase, userId: s.user.id };
}

// Ajouter / retirer des favoris
export async function basculerFavori(annonceId: string) {
  const { supabase, userId } = await session();
  const { data } = await supabase
    .from("favoris")
    .select("id")
    .eq("user_id", userId)
    .eq("annonce_id", annonceId)
    .maybeSingle();

  if (data) await supabase.from("favoris").delete().eq("id", data.id);
  else await supabase.from("favoris").insert({ user_id: userId, annonce_id: annonceId });

  revalidatePath(`/annonces/${annonceId}`);
}

// Vendeur : marquer vendue / remettre en ligne
export async function changerStatut(annonceId: string, statut: "vendue" | "en_ligne") {
  const { supabase } = await session();
  const { error } = await supabase.from("annonces").update({ statut }).eq("id", annonceId);
  if (error) throw new Error(error.message);
  revalidatePath(`/annonces/${annonceId}`);
  revalidatePath("/annonces");
}

// Vendeur : supprimer l'annonce et ses photos
export async function supprimerAnnonce(annonceId: string) {
  const { supabase } = await session();
  const { data } = await supabase.from("annonces").select("photos").eq("id", annonceId).single();
  const { error } = await supabase.from("annonces").delete().eq("id", annonceId);
  if (error) throw new Error(error.message);
  if (data?.photos?.length) await supabase.storage.from("photos").remove(data.photos);
  revalidatePath("/annonces");
  redirect("/annonces");
}

// Signaler une annonce (une seule fois par étudiant)
export async function signalerAnnonce(annonceId: string, formData: FormData) {
  const { supabase, userId } = await session();
  const motif = String(formData.get("motif") ?? "Autre");
  const { error } = await supabase.from("signalements").insert({
    auteur_id: userId,
    type_contenu: "annonce",
    contenu_id: annonceId,
    motif,
  });
  // 23505 = déjà signalé par cet étudiant : on ne fait rien de plus
  if (error && error.code !== "23505") throw new Error(error.message);
  redirect(`/annonces/${annonceId}?signale=1`);
}
