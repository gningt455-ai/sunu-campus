"use client";

import { useMemo, useState } from "react";
import { TYPES_LIEU, lieuxParType, type Lieu } from "@/lib/lieux";

// Choix du lieu de rencontre : boutons pour les lieux courants, recherche pour les autres.
// La valeur choisie est envoyée dans un champ caché nommé "lieu" ("" = lieu à discuter par message).

function normaliser(t: string) {
  return t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export default function ChoixLieu({ lieux, populaires, initial = "" }: { lieux: Lieu[]; populaires: string[]; initial?: string }) {
  const [choix, setChoix] = useState(initial);
  const [recherche, setRecherche] = useState("");
  const [tout, setTout] = useState(false);

  const parId = useMemo(() => new Map(lieux.map((l) => [l.id, l])), [lieux]);
  const lieuChoisi = choix ? parId.get(choix) : undefined;

  // Boutons : les lieux courants, plus le lieu choisi s'il n'en fait pas partie
  const boutons = populaires.map((id) => parId.get(id)).filter((l): l is Lieu => !!l);
  if (lieuChoisi && !boutons.some((l) => l.id === lieuChoisi.id)) boutons.unshift(lieuChoisi);

  // Recherche par nom ou par type (« pav » → pavillons, « fac » → facultés)
  const q = normaliser(recherche.trim());
  const resultats = q
    ? lieux
        .filter((l) => normaliser(l.nom).includes(q) || normaliser(TYPES_LIEU[l.type]).includes(q))
        .sort((a, b) => a.nom.localeCompare(b.nom, "fr", { numeric: true }))
    : [];

  function choisir(id: string) {
    setChoix(id);
    setRecherche("");
    setTout(false);
  }

  const puce = (actif: boolean) =>
    `rounded-full border px-3.5 py-2 text-[13px] font-semibold ${actif ? "border-vert bg-vert text-white" : "border-bord bg-white text-encre"}`;

  const ligneLieu = (l: Lieu, avecType: boolean) => (
    <li key={l.id}>
      <button
        type="button"
        onClick={() => choisir(l.id)}
        className={`flex min-h-[44px] w-full items-center justify-between gap-2 px-3 text-left text-[14px] hover:bg-fond ${choix === l.id ? "font-bold text-vert" : ""}`}
      >
        <span>{l.nom}</span>
        {avecType && <span className="flex-none text-[11px] text-gris">{TYPES_LIEU[l.type].split(" (")[0]}</span>}
      </button>
    </li>
  );

  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-2 text-[13px] font-semibold">Lieu de rencontre sur le campus</legend>
      <input type="hidden" name="lieu" value={choix} />

      <div className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={choix === ""} onClick={() => choisir("")} className={puce(choix === "")}>
          On en discute par message
        </button>
        {boutons.map((l) => (
          <button key={l.id} type="button" aria-pressed={choix === l.id} onClick={() => choisir(l.id)} className={puce(choix === l.id)}>
            {l.nom}
          </button>
        ))}
      </div>

      <label className="flex h-12 items-center gap-2 rounded-xl border border-bord bg-white px-3 focus-within:border-vert focus-within:ring-2 focus-within:ring-vert/20">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-none text-gris" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m20 20-4.2-4.2" />
        </svg>
        <span className="sr-only">Chercher un autre lieu</span>
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Autre lieu : pavillon, fac, resto…"
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
        />
      </label>

      {q && (
        <ul className="max-h-72 overflow-y-auto rounded-xl border border-bord bg-white py-1">
          {resultats.length === 0 ? (
            <li className="px-3 py-3 text-[13px] text-gris">Aucun lieu trouvé. Choisis « On en discute par message ».</li>
          ) : (
            resultats.map((l) => ligneLieu(l, true))
          )}
        </ul>
      )}

      {!q && (
        <button type="button" onClick={() => setTout(!tout)} className="self-start text-[13px] font-semibold text-vert">
          {tout ? "Masquer la liste" : "Voir tous les lieux"}
        </button>
      )}
      {!q && tout && (
        <div className="max-h-80 overflow-y-auto rounded-xl border border-bord bg-white py-1">
          {lieuxParType(lieux).map((g) => (
            <div key={g.type}>
              <p className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wide text-gris">{g.titre}</p>
              <ul>{g.lieux.map((l) => ligneLieu(l, false))}</ul>
            </div>
          ))}
        </div>
      )}
    </fieldset>
  );
}
