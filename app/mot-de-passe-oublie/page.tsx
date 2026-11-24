"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import Logo from "@/components/Logo";
import { Alerte, Bouton, Champ } from "@/components/Champ";
import { createClient } from "@/lib/supabase/client";

export default function MotDePasseOublie() {
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [lienExpire, setLienExpire] = useState(false);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    setLienExpire(new URLSearchParams(window.location.search).get("lien") === "expire");
  }, []);

  async function envoyer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErreur("Indique une adresse e-mail valide.");

    setChargement(true);
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/nouveau-mot-de-passe`,
    });
    setChargement(false);
    if (error && error.message.toLowerCase().includes("rate limit")) {
      return setErreur("Trop de demandes. Attends quelques minutes puis réessaie.");
    }
    // Par sécurité, même message que le compte existe ou non
    setEnvoye(true);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-10">
      <Logo />
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[26px] font-extrabold tracking-tight">Mot de passe oublié</h1>
        <p className="text-sm leading-relaxed text-gris">Indique l&apos;e-mail de ton compte : tu recevras un lien pour choisir un nouveau mot de passe.</p>
      </div>

      {lienExpire && !envoye && <Alerte type="erreur">Ce lien a expiré ou a déjà été utilisé. Demande un nouveau lien ci-dessous.</Alerte>}

      {envoye ? (
        <Alerte type="succes">
          Si un compte existe avec cette adresse, un e-mail vient d&apos;être envoyé. Ouvre-le et clique sur le lien (pense à regarder dans les
          spams). Le lien est valable une heure.
        </Alerte>
      ) : (
        <form onSubmit={envoyer} className="flex flex-col gap-4" noValidate>
          <Champ label="E-mail" name="email" type="email" autoComplete="email" placeholder="awa.diop@exemple.com" />
          {erreur && <Alerte type="erreur">{erreur}</Alerte>}
          <Bouton type="submit" chargement={chargement}>
            Recevoir le lien
          </Bouton>
        </form>
      )}

      <Link href="/connexion" className="text-center text-sm font-bold text-vert">
        ← Retour à la connexion
      </Link>
    </main>
  );
}
