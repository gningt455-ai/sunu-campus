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

// Lieux de rencontre proposés en boutons : les plus utilisés dans les annonces récentes,
// complétés par des lieux connus de tous (Couloir de la mort, Place Omar Pène, bibliothèque…)
const LIEUX_PAR_DEFAUT = ["couloir de la mort", "omar pene", "biblioth", "resto"];

export function lieuxPopulaires(lieux: Lieu[], lieuxUtilises: string[], nombre = 6): string[] {
  const existe = new Set(lieux.map((l) => l.id));
  const compte = new Map<string, number>();
  for (const id of lieuxUtilises) if (existe.has(id)) compte.set(id, (compte.get(id) ?? 0) + 1);

  const choisis = [...compte.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);

  const sansAccent = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  for (const mot of LIEUX_PAR_DEFAUT) {
    if (choisis.length >= nombre) break;
    const l = lieux.find((x) => sansAccent(x.nom).includes(mot) && !choisis.includes(x.id));
    if (l) choisis.push(l.id);
  }
  return choisis.slice(0, nombre);
}
