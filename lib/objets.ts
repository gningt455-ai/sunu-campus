import type { SupabaseClient } from "@supabase/supabase-js";

export const CATEGORIES_OBJET = {
  carte_etudiant: "Carte étudiant",
  piece_identite: "Pièce d'identité",
  telephone: "Téléphone",
  cles: "Clés",
  sac: "Sac",
  autre: "Autre",
} as const;

export type CategorieObjet = keyof typeof CATEGORIES_OBJET;
export type SensObjet = "trouve" | "perdu";

// Catégories pour lesquelles une photo est interdite (vie privée)
export const SANS_PHOTO: CategorieObjet[] = ["carte_etudiant", "piece_identite"];

export type ResumeObjet = {
  id: string;
  sens: SensObjet;
  categorie: CategorieObjet;
  titre: string;
  nom_sur_carte: string | null;
  lieu_texte: string | null;
  date_evenement: string | null;
  photo: string | null;
  statut: "en_cours" | "rendu" | "masque";
  created_at: string;
  lieux: { nom: string } | null;
};

// Cartes ou pièces trouvées qui portent le prénom ET le nom de l'étudiant
export async function cartesTrouveesPour(supabase: SupabaseClient, prenom: string, nom: string): Promise<{ id: string; titre: string }[]> {
  const nettoyer = (t: string) => t.trim().replace(/[%_,()]/g, "");
  const p = nettoyer(prenom);
  const n = nettoyer(nom);
  if (p.length < 2 || n.length < 2) return [];
  const { data } = await supabase
    .from("objets")
    .select("id, titre")
    .eq("sens", "trouve")
    .eq("statut", "en_cours")
    .in("categorie", SANS_PHOTO)
    .ilike("nom_sur_carte", `%${p}%`)
    .ilike("nom_sur_carte", `%${n}%`)
    .limit(5);
  return (data ?? []) as { id: string; titre: string }[];
}
