// Lit l'utilisateur connecté et son profil (côté serveur).
// - getClaims() vérifie le jeton de session localement : pas d'aller-retour vers Supabase.
// - cache() : un seul calcul par page, même si l'en-tête et la page l'appellent tous les deux.
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Profil = {
  id: string;
  prenom: string;
  nom: string;
  faculte: string | null;
  niveau: string | null;
  statut: "en_attente" | "verifie" | "refuse" | "bloque";
  role: "etudiant" | "admin";
};

export const lireSession = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return { supabase, user: null, profil: null };

  const { data: profil } = await supabase
    .from("profiles")
    .select("id, prenom, nom, faculte, niveau, statut, role")
    .eq("id", id)
    .single<Profil>();

  return { supabase, user: { id }, profil };
});
