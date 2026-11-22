// Envoi (ou renvoi) de la carte étudiant : photo dans le bucket privé « cartes »
// + ligne dans la table « verifications ».
import type { SupabaseClient } from "@supabase/supabase-js";
import { TAILLE_MAX_CARTE, TYPES_IMAGE } from "@/lib/constantes";

export function verifierPhoto(photo: File | null): string | null {
  if (!photo || photo.size === 0) return "Ajoute la photo de ta carte étudiant.";
  if (!TYPES_IMAGE.includes(photo.type))
    return "La photo doit être au format JPG, PNG ou WEBP. Sur iPhone, fais une capture d'écran de la photo.";
  if (photo.size > TAILLE_MAX_CARTE) return "La photo est trop lourde (5 Mo maximum).";
  return null;
}

export async function envoyerCarte(
  supabase: SupabaseClient,
  userId: string,
  photo: File,
  numeroCarte: string
): Promise<string | null> {
  const extension = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
  const chemin = `${userId}/carte-${Date.now()}.${extension}`;

  const { error: erreurPhoto } = await supabase.storage
    .from("cartes")
    .upload(chemin, photo, { contentType: photo.type, upsert: false });
  if (erreurPhoto) return "La photo n'a pas pu être envoyée. Vérifie ta connexion et réessaie.";

  // Première demande ou nouvelle demande après un refus ?
  const { data: existante } = await supabase
    .from("verifications")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  const { error } = existante
    ? await supabase
        .from("verifications")
        .update({ numero_carte: numeroCarte, photo_carte_path: chemin })
        .eq("user_id", userId)
    : await supabase
        .from("verifications")
        .insert({ user_id: userId, numero_carte: numeroCarte, photo_carte_path: chemin });

  if (error) return "Ta demande n'a pas pu être enregistrée. Réessaie dans un instant.";
  return null;
}
