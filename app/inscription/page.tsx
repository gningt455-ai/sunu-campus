"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Logo from "@/components/Logo";
import ChampPhotoCarte from "@/components/ChampPhotoCarte";
import { Alerte, Bouton, Champ, Liste } from "@/components/Champ";
import { FACULTES, NIVEAUX } from "@/lib/constantes";
import { envoyerCarte, verifierPhoto } from "@/lib/carte";
import { createClient } from "@/lib/supabase/client";

function traduireErreur(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already exists")) return "Un compte existe déjà avec cet e-mail. Connecte-toi.";
  if (m.includes("password")) return "Le mot de passe est trop faible : 8 caractères minimum.";
  if (m.includes("rate limit")) return "Trop de tentatives. Attends quelques minutes puis réessaie.";
  if (m.includes("invalid") && m.includes("email")) return "Cette adresse e-mail n'est pas valide.";
  return "L'inscription a échoué. Vérifie ta connexion et réessaie.";
}

export default function Inscription() {
  const router = useRouter();
  const [photo, setPhoto] = useState<File | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [confirmerEmail, setConfirmerEmail] = useState(false);

  async function inscrire(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    const f = new FormData(e.currentTarget);
    const val = (k: string) => String(f.get(k) ?? "").trim();

    const prenom = val("prenom");
    const nom = val("nom");
    const email = val("email").toLowerCase();
    const telephone = val("telephone").replace(/\s/g, "");
    const faculte = val("faculte");
    const niveau = val("niveau");
    const numeroCarte = val("numero_carte");
    const motDePasse = String(f.get("mot_de_passe") ?? "");

    // Vérifications avant envoi
    if (!prenom || !nom) return setErreur("Indique ton prénom et ton nom.");
    if (!/^7[05678]\d{7}$/.test(telephone)) return setErreur("Numéro de téléphone invalide (ex. 77 123 45 67).");
    if (!faculte) return setErreur("Choisis ta faculté.");
    if (numeroCarte.length < 4) return setErreur("Indique ton numéro de carte étudiant.");
    const erreurPhoto = verifierPhoto(photo);
    if (erreurPhoto) return setErreur(erreurPhoto);
    if (motDePasse.length < 8) return setErreur("Le mot de passe doit faire au moins 8 caractères.");
    if (!f.get("charte")) return setErreur("Accepte la charte d'utilisation pour continuer.");

    setChargement(true);
    const supabase = createClient();

    // 1. Création du compte (le profil est créé automatiquement par la base)
    const { data, error } = await supabase.auth.signUp({
      email,
      password: motDePasse,
      options: { data: { prenom, nom, faculte, niveau, telephone: `221${telephone}` } },
    });
    if (error) {
      setChargement(false);
      return setErreur(traduireErreur(error.message));
    }

    // Si Supabase demande de confirmer l'e-mail, il n'y a pas encore de session
    if (!data.session || !data.user) {
      setChargement(false);
      return setConfirmerEmail(true);
    }

    // 2. Envoi de la carte étudiant
    const erreurCarte = await envoyerCarte(supabase, data.user.id, photo as File, numeroCarte);
    // En cas d'échec, la page d'attente proposera de renvoyer la carte
    router.push(erreurCarte ? "/attente?carte=echec" : "/attente");
    router.refresh();
  }

  if (confirmerEmail) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-10">
        <Logo />
        <h1 className="text-2xl font-extrabold">Vérifie ta boîte e-mail</h1>
        <p className="text-gris">
          Nous t&apos;avons envoyé un lien de confirmation. Clique dessus, puis connecte-toi : tu pourras alors envoyer la photo de ta carte.
        </p>
        <Link href="/connexion" className="text-center font-bold text-vert">
          Aller à la connexion
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-6 py-8">
      <Logo />
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[26px] font-extrabold tracking-tight">Crée ton compte étudiant</h1>
        <p className="text-sm leading-relaxed text-gris">
          Tous les comptes sont vérifiés avec la carte étudiant UCAD. Ton numéro et la photo de ta carte ne sont jamais affichés
          publiquement.
        </p>
      </div>

      <form onSubmit={inscrire} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Champ label="Prénom" name="prenom" autoComplete="given-name" placeholder="Awa" required />
          <Champ label="Nom" name="nom" autoComplete="family-name" placeholder="Diop" required />
        </div>
        <Champ label="E-mail" name="email" type="email" autoComplete="email" placeholder="awa.diop@exemple.com" required />
        <Champ label="Numéro de téléphone" name="telephone" type="tel" inputMode="numeric" placeholder="77 123 45 67" required />
        <div className="grid grid-cols-[1fr_110px] gap-3">
          <Liste label="Faculté" name="faculte" options={FACULTES} required />
          <Liste label="Niveau" name="niveau" options={NIVEAUX} />
        </div>
        <Champ label="Numéro de carte étudiant" name="numero_carte" placeholder="Ex. 2023 0000 0" required />
        <ChampPhotoCarte onChange={setPhoto} />
        <Champ label="Mot de passe" name="mot_de_passe" type="password" autoComplete="new-password" placeholder="8 caractères minimum" required />

        <label className="flex items-start gap-3 text-[13px] leading-relaxed text-gris">
          <input type="checkbox" name="charte" className="mt-0.5 h-5 w-5 accent-[#0e6b4e]" />
          J&apos;accepte la charte de Sunu Campus : respect des autres, aucun contenu interdit, pas de vente de codifications.
        </label>

        <Alerte type="succes">
          Ton compte sera activé dès que l&apos;équipe aura vérifié ta carte. En attendant, tu pourras parcourir les annonces.
        </Alerte>

        {erreur && <Alerte type="erreur">{erreur}</Alerte>}

        <Bouton type="submit" chargement={chargement}>
          Envoyer ma demande
        </Bouton>
      </form>

      <p className="text-center text-sm text-gris">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="font-bold text-vert">
          Se connecter
        </Link>
      </p>
    </main>
  );
}
