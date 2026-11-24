export const CATEGORIES_MUR = {
  question: { nom: "Question", carte: "bg-[#e6eef8] border-[#cddcf0]", badge: "bg-[#1f4e8c] text-white" },
  coup_de_gueule: { nom: "Coup de gueule", carte: "bg-jaune-clair border-[#f3e0b0]", badge: "bg-[#8a5a00] text-white" },
} as const;

export type CategorieMur = keyof typeof CATEGORIES_MUR;

export type Publication = {
  id: string;
  categorie: CategorieMur;
  texte: string;
  created_at: string;
  nb_reactions: number;
  nb_commentaires: number;
  j_aime: boolean;
  est_a_moi: boolean;
};

export type Commentaire = { id: string; publication_id: string; texte: string; created_at: string; est_a_moi: boolean };

export const MOTIFS_MUR = ["Une personne est nommée", "Insulte ou harcèlement", "Contenu choquant", "Fausse information", "Autre"];
