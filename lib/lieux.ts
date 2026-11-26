// Types de lieux du campus et regroupement pour les listes déroulantes
export const TYPES_LIEU = {
  pavillon: "Pavillons (campus social)",
  faculte: "Facultés et écoles",
  resto: "Restaurants",
  service: "Services (bibliothèque, administration…)",
  autre: "Places et autres lieux",
} as const;

export type TypeLieu = keyof typeof TYPES_LIEU;
export type Lieu = { id: string; nom: string; type: TypeLieu };

// Regroupe les lieux par type, dans l'ordre de TYPES_LIEU, triés par nom
export function lieuxParType(lieux: Lieu[]): { type: TypeLieu; titre: string; lieux: Lieu[] }[] {
  return (Object.keys(TYPES_LIEU) as TypeLieu[])
    .map((type) => ({
      type,
      titre: TYPES_LIEU[type],
      lieux: lieux.filter((l) => l.type === type).sort((a, b) => a.nom.localeCompare(b.nom, "fr", { numeric: true })),
    }))
    .filter((g) => g.lieux.length > 0);
}

// Lieux de rencontre proposés en boutons dans le formulaire d'annonce (dans cet ordre).
// Les autres lieux restent accessibles par la recherche.
const LIEUX_EN_BOUTONS = ["couloir de la mort", "place omar pene", "zone a", "zone b", "zone c"];

export function lieuxEnBoutons(lieux: Lieu[]): string[] {
  const sansAccent = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  return LIEUX_EN_BOUTONS.map((nom) => lieux.find((l) => sansAccent(l.nom) === nom)?.id).filter((id): id is string => !!id);
}
