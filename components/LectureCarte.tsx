"use client";

import { useEffect, useState } from "react";

// Lecture automatique de la photo de la carte étudiant (OCR), pour aider l'administrateur.
// Le texte est lu dans le navigateur de l'admin avec Tesseract.js (chargé à la demande).
// Ce n'est qu'une aide : l'admin garde la décision de valider ou refuser.

type Tesseract = {
  createWorker: (langue: string) => Promise<{ recognize: (image: string) => Promise<{ data: { text: string } }> }>;
};
declare global {
  interface Window {
    Tesseract?: Tesseract;
  }
}

const SCRIPT = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";

// Un seul moteur de lecture pour toute la page, et une photo à la fois
let moteur: ReturnType<Tesseract["createWorker"]> | null = null;
let file: Promise<unknown> = Promise.resolve();

function chargerMoteur() {
  if (!moteur) {
    moteur = new Promise<void>((ok, echec) => {
      if (window.Tesseract) return ok();
      const s = document.createElement("script");
      s.src = SCRIPT;
      s.async = true;
      s.onload = () => ok();
      s.onerror = () => echec(new Error("Chargement impossible"));
      document.head.appendChild(s);
    }).then(() => window.Tesseract!.createWorker("eng"));
    moteur.catch(() => {
      moteur = null;
    });
  }
  return moteur;
}

function lireTexte(url: string): Promise<string> {
  const tache = file.then(async () => {
    const w = await chargerMoteur();
    const { data } = await w.recognize(url);
    return data.text;
  });
  file = tache.catch(() => undefined);
  return tache;
}

// Sans accents, en majuscules, lettres et chiffres seulement
function normaliser(t: string) {
  return t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase();
}

// Suites de chiffres lues sur la photo (corrige les confusions courantes : O→0, I→1, S→5, B→8)
function chiffresLus(texte: string) {
  const blocs: string[] = [];
  for (const mot of normaliser(texte).split(/\s+/)) {
    const nbChiffres = (mot.match(/\d/g) ?? []).length;
    if (nbChiffres === 0 || nbChiffres < mot.replace(/[^A-Z0-9]/g, "").length / 2) {
      blocs.push("|");
      continue;
    }
    blocs.push(mot.replace(/O/g, "0").replace(/[IL]/g, "1").replace(/S/g, "5").replace(/B/g, "8").replace(/\D/g, ""));
  }
  // Les morceaux voisins sont recollés (un numéro peut être écrit en plusieurs groupes)
  return blocs.join("").split("|").filter(Boolean);
}

type Resultat = { numero: boolean; prenom: boolean; nom: boolean };

export default function LectureCarte({ url, numero, prenom, nom }: { url: string; numero: string; prenom: string; nom: string }) {
  const [etat, setEtat] = useState<"lecture" | "fini" | "erreur">("lecture");
  const [resultat, setResultat] = useState<Resultat | null>(null);

  useEffect(() => {
    let actif = true;
    lireTexte(url)
      .then((texte) => {
        if (!actif) return;
        const attendu = numero.replace(/\D/g, "");
        const lu = normaliser(texte).replace(/[^A-Z]/g, " ");
        const contientMot = (m: string) =>
          normaliser(m)
            .split(/[^A-Z]+/)
            .filter((x) => x.length >= 2)
            .every((x) => lu.includes(x));
        setResultat({
          numero: attendu.length >= 4 && chiffresLus(texte).some((c) => c.includes(attendu)),
          prenom: contientMot(prenom),
          nom: contientMot(nom),
        });
        setEtat("fini");
      })
      .catch(() => actif && setEtat("erreur"));
    return () => {
      actif = false;
    };
  }, [url, numero, prenom, nom]);

  if (etat === "lecture") {
    return <p className="rounded-lg bg-fond px-3 py-2 text-xs font-semibold text-gris">Lecture automatique de la carte…</p>;
  }
  if (etat === "erreur" || !resultat) {
    return <p className="rounded-lg bg-fond px-3 py-2 text-xs font-semibold text-gris">Lecture automatique impossible : vérifie la photo à l&apos;œil.</p>;
  }

  const ligne = (ok: boolean, texteOk: string, texteKo: string) => (
    <li className={`flex items-start gap-1.5 ${ok ? "text-vert-fonce" : "text-[#8a5a00]"}`}>
      <span aria-hidden="true">{ok ? "✅" : "⚠️"}</span>
      <span>{ok ? texteOk : texteKo}</span>
    </li>
  );
  const toutOk = resultat.numero && resultat.prenom && resultat.nom;

  return (
    <div className={`flex flex-col gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${toutOk ? "bg-vert-clair" : "bg-[#fff4d6]"}`}>
      <span className="font-bold text-encre">Lecture automatique</span>
      <ul className="flex flex-col gap-1">
        {ligne(resultat.numero, "Le numéro de carte est bien sur la photo", "Numéro non retrouvé sur la photo (photo floue ou numéro différent)")}
        {ligne(resultat.prenom && resultat.nom, "Le prénom et le nom sont sur la photo", "Prénom ou nom non retrouvé sur la photo")}
      </ul>
      <span className="font-normal text-gris">Simple aide : regarde toujours la photo avant de valider.</span>
    </div>
  );
}
