"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import ChampPhotoCarte from "@/components/ChampPhotoCarte";
import { Alerte, Bouton, Champ } from "@/components/Champ";
import { envoyerCarte, verifierPhoto } from "@/lib/carte";
import { createClient } from "@/lib/supabase/client";

// Envoi ou renvoi de la carte étudiant depuis la page d'attente
export default function FormulaireCarte({ userId, libelle }: { userId: string; libelle: string }) {
  const router = useRouter();
  const [photo, setPhoto] = useState<File | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function envoyer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    const numero = String(new FormData(e.currentTarget).get("numero_carte") ?? "").trim();
    if (numero.length < 4) return setErreur("Indique ton numéro de carte étudiant.");
    const erreurPhoto = verifierPhoto(photo);
    if (erreurPhoto) return setErreur(erreurPhoto);

    setChargement(true);
    const err = await envoyerCarte(createClient(), userId, photo as File, numero);
    setChargement(false);
    if (err) return setErreur(err);
    router.replace("/attente");
    router.refresh();
  }

  return (
    <form onSubmit={envoyer} className="flex flex-col gap-4 rounded-2xl border border-[#e1e5e2] bg-white p-4" noValidate>
      <Champ label="Numéro de carte étudiant" name="numero_carte" placeholder="Ex. 2023 0000 0" />
      <ChampPhotoCarte onChange={setPhoto} />
      {erreur && <Alerte type="erreur">{erreur}</Alerte>}
      <Bouton type="submit" chargement={chargement}>
        {libelle}
      </Bouton>
    </form>
  );
}
