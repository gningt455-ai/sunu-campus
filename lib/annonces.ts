// Règles d'affichage des annonces selon la catégorie

// Catégories où « Neuf / Occasion » n'a pas de sens (nourriture, services)
export const CATEGORIES_SANS_ETAT = ["alimentation", "logiciels"];

// Disponibilité, seulement pour la catégorie Alimentation
export type Disponibilite = "aujourdhui" | "tous_les_jours";
export const DISPONIBILITES: Record<Disponibilite, string> = {
  aujourdhui: "Aujourd'hui seulement",
  tous_les_jours: "Tous les jours",
};

// Petit texte affiché sous le prix : « Occasion », « Neuf », « Aujourd'hui seulement »…
export function libelleEtat(a: { etat: "neuf" | "occasion"; disponibilite?: Disponibilite | null; categories?: { slug: string } | null }) {
  const slug = a.categories?.slug ?? "";
  if (slug === "alimentation") return a.disponibilite ? DISPONIBILITES[a.disponibilite] : null;
  if (CATEGORIES_SANS_ETAT.includes(slug)) return null;
  return a.etat === "neuf" ? "Neuf" : "Occasion";
}

// Une offre de nourriture « aujourd'hui seulement » n'est plus montrée dans les listes après 24 heures
export function offreDuJourExpiree(a: { disponibilite?: Disponibilite | null; created_at?: string }) {
  if (a.disponibilite !== "aujourdhui" || !a.created_at) return false;
  return Date.now() - new Date(a.created_at).getTime() > 24 * 3600 * 1000;
}
