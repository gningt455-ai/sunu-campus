"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Logo from "@/components/Logo";
import { Alerte, Bouton, Champ } from "@/components/Champ";
import { createClient } from "@/lib/supabase/client";

export default function Connexion() {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function connecter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "").trim().toLowerCase();
    const password = String(f.get("mot_de_passe") ?? "");
    if (!email || !password) return setErreur("Indique ton e-mail et ton mot de passe.");

    setChargement(true);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) {
      setChargement(false);
      const m = error.message.toLowerCase();
      return setErreur(
        m.includes("not confirmed")
          ? "Confirme d'abord ton e-mail grâce au lien reçu."
          : "E-mail ou mot de passe incorrect."
      );
    }
    // La page d'accueil redirige selon le statut du compte
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-10">
      <Logo />
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[26px] font-extrabold tracking-tight">Connexion</h1>
        <p className="text-sm text-gris">Content de te revoir sur Sunu Campus.</p>
      </div>
      <form onSubmit={connecter} className="flex flex-col gap-4" noValidate>
        <Champ label="E-mail" name="email" type="email" autoComplete="email" placeholder="awa.diop@exemple.com" />
        <Champ label="Mot de passe" name="mot_de_passe" type="password" autoComplete="current-password" />
        {erreur && <Alerte type="erreur">{erreur}</Alerte>}
        <Bouton type="submit" chargement={chargement}>
          Se connecter
        </Bouton>
      </form>
      <p className="text-center text-sm text-gris">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-bold text-vert">
          Créer mon compte
        </Link>
      </p>
    </main>
  );
}
