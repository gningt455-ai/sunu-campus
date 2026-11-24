"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Logo from "@/components/Logo";
import { Alerte, Bouton, Champ } from "@/components/Champ";
import { createClient } from "@/lib/supabase/client";

// Page ouverte depuis le lien reçu par e-mail : la session est déjà active
export default function NouveauMotDePasse() {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function changer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    const f = new FormData(e.currentTarget);
    const motDePasse = String(f.get("mot_de_passe") ?? "");
    const confirmation = String(f.get("confirmation") ?? "");
    if (motDePasse.length < 8) return setErreur("Le mot de passe doit faire au moins 8 caractères.");
    if (motDePasse !== confirmation) return setErreur("Les deux mots de passe ne sont pas identiques.");

    setChargement(true);
    const { error } = await createClient().auth.updateUser({ password: motDePasse });
    setChargement(false);
    if (error) {
      const m = error.message.toLowerCase();
      return setErreur(
        m.includes("session")
          ? "Le lien a expiré. Demande un nouveau lien depuis « Mot de passe oublié »."
          : m.includes("different") || m.includes("same")
            ? "Choisis un mot de passe différent de l'ancien."
            : "Le mot de passe n'a pas pu être changé. Réessaie."
      );
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-10">
      <Logo />
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[26px] font-extrabold tracking-tight">Nouveau mot de passe</h1>
        <p className="text-sm text-gris">Choisis ton nouveau mot de passe (8 caractères minimum).</p>
      </div>
      <form onSubmit={changer} className="flex flex-col gap-4" noValidate>
        <Champ label="Nouveau mot de passe" name="mot_de_passe" type="password" autoComplete="new-password" />
        <Champ label="Confirme le mot de passe" name="confirmation" type="password" autoComplete="new-password" />
        {erreur && <Alerte type="erreur">{erreur}</Alerte>}
        <Bouton type="submit" chargement={chargement}>
          Enregistrer
        </Bouton>
      </form>
      <Link href="/mot-de-passe-oublie" className="text-center text-sm font-bold text-vert">
        Demander un nouveau lien
      </Link>
    </main>
  );
}
