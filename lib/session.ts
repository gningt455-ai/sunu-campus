// Lit l'utilisateur connecté et son profil (côté serveur).
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

export async function lireSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profil: null };

  const { data: profil } = await supabase
    .from("profiles")
    .select("id, prenom, nom, faculte, niveau, statut, role")
    .eq("id", user.id)
    .single<Profil>();

  return { supabase, user, profil };
}
