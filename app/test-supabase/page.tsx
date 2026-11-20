// Page de test temporaire : http://localhost:3000/test-supabase
// À supprimer quand la connexion est validée.
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TestSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  let statut: "ok" | "erreur" | "config" = "config";
  let detail = "";

  if (url && key) {
    const supabase = await createClient();
    const { error } = await supabase.from("categories").select("id").limit(1);

    if (!error) {
      statut = "ok";
      detail = "Connexion réussie et données lues.";
    } else if (error.code === "42501") {
      // « permission denied » : Supabase répond, et bloque bien les visiteurs non connectés.
      statut = "ok";
      detail = "Supabase répond, et bloque bien les visiteurs non connectés (c'est voulu).";
    } else {
      statut = "erreur";
      detail = `${error.code ?? ""} ${error.message}`;
    }
  } else {
    detail = "Les variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY sont absentes du fichier .env.local.";
  }

  const couleur = statut === "ok" ? "#0E6B4E" : "#B3261E";
  const titre =
    statut === "ok" ? "Connecté à Supabase" : statut === "config" ? "Configuration manquante" : "Erreur de connexion";

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 32, maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ color: couleur, fontSize: 28, fontWeight: 800 }}>{titre}</h1>
      <p style={{ fontSize: 16, lineHeight: 1.5 }}>{detail}</p>
      <p style={{ fontSize: 13, color: "#4A5852" }}>Projet : {url ?? "—"}</p>
    </main>
  );
}
