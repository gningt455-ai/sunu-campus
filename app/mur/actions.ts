"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { lireSession } from "@/lib/session";
import { CATEGORIES_MUR } from "@/lib/mur";

async function session() {
  const s = await lireSession();
  if (!s.user) redirect("/connexion");
  return { supabase: s.supabase, userId: s.user.id };
}

function erreurTexte(message: string) {
  return message.includes("interdit") ? "interdit" : "envoi";
}

export async function publier(formData: FormData) {
  const { supabase, userId } = await session();
  const texte = String(formData.get("texte") ?? "").trim();
  const categorie = String(formData.get("categorie") ?? "");
  if (!formData.get("charte")) redirect("/mur?erreur=charte");
  if (texte.length < 3) redirect("/mur?erreur=court");
  if (!(categorie in CATEGORIES_MUR)) redirect("/mur?erreur=categorie");

  const { error } = await supabase.from("publications").insert({ auteur_id: userId, categorie, texte });
  if (error) redirect(`/mur?erreur=${erreurTexte(error.message)}`);
  revalidatePath("/mur");
  redirect("/mur?publie=1");
}

export async function basculerReaction(publicationId: string, jAime: boolean, retour: string) {
  const { supabase, userId } = await session();
  if (jAime) await supabase.from("reactions").delete().eq("publication_id", publicationId).eq("user_id", userId);
  else await supabase.from("reactions").insert({ publication_id: publicationId, user_id: userId });
  revalidatePath(retour);
}

export async function supprimerPublication(publicationId: string) {
  const { supabase } = await session();
  await supabase.from("publications").delete().eq("id", publicationId);
  revalidatePath("/mur");
  redirect("/mur");
}

export async function commenter(publicationId: string, formData: FormData) {
  const { supabase, userId } = await session();
  const texte = String(formData.get("texte") ?? "").trim();
  if (texte.length < 1) redirect(`/mur/${publicationId}`);
  const { error } = await supabase.from("commentaires").insert({ publication_id: publicationId, auteur_id: userId, texte });
  if (error) redirect(`/mur/${publicationId}?erreur=${erreurTexte(error.message)}`);
  revalidatePath(`/mur/${publicationId}`);
  redirect(`/mur/${publicationId}#commentaires`);
}

export async function supprimerCommentaire(commentaireId: string, publicationId: string) {
  const { supabase } = await session();
  await supabase.from("commentaires").delete().eq("id", commentaireId);
  revalidatePath(`/mur/${publicationId}`);
}

export async function signaler(type: "publication" | "commentaire", contenuId: string, retour: string, formData: FormData) {
  const { supabase, userId } = await session();
  const motif = String(formData.get("motif") ?? "Autre");
  const { error } = await supabase.from("signalements").insert({ auteur_id: userId, type_contenu: type, contenu_id: contenuId, motif });
  if (error && error.code !== "23505") throw new Error(error.message);
  redirect(`${retour}${retour.includes("?") ? "&" : "?"}signale=1`);
}
