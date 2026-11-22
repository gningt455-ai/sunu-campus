export function formatPrix(prix: number): string {
  return `${prix.toLocaleString("fr-FR")} FCFA`;
}

export function ilYa(date: string): string {
  const minutes = Math.round((Date.now() - new Date(date).getTime()) / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  if (minutes < 1440) return `il y a ${Math.round(minutes / 60)} h`;
  const jours = Math.round(minutes / 1440);
  return jours === 1 ? "hier" : `il y a ${jours} jours`;
}

export function estUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}
