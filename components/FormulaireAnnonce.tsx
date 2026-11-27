"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alerte, Bouton, Champ } from "@/components/Champ";
import { compresserImage } from "@/lib/photos";
import { TYPES_IMAGE } from "@/lib/constantes";
import { createClient } from "@/lib/supabase/client";
import ChoixLieu from "@/components/ChoixLieu";
import type { Lieu } from "@/lib/lieux";
import { CATEGORIES_SANS_ETAT, DISPONIBILITES } from "@/lib/annonces";

type Option = { id: string | number; nom: string; slug: string };

const MAX_PHOTOS = 3;
const styleChamp =
  "w-full rounded-xl border border-bord bg-white px-3 text-[15px] font-normal text-encre outline-none focus:border-vert focus:ring-2 focus:ring-vert/20";

export default function FormulaireAnnonce({
  userId,
  categories,
  lieux,
  lieuxPopulaires,
  dernierLieu,
}: {
  userId: string;
  categories: Option[];
  lieux: Lieu[];
  lieuxPopulaires: string[];
  dernierLieu: string;
}) {
  const router = useRouter();
  const [categorie, setCategorie] = useState<string>("");
  const [photos, setPhotos] = useState<{ fichier: File; apercu: string }[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [etape, setEtape] = useState<string | null>(null);

  // Le champ « État » est caché pour l'alimentation et les services ; l'alimentation a « Disponible »
  const slug = categories.find((c) => String(c.id) === categorie)?.slug ?? "";
  const avecEtat = !CATEGORIES_SANS_ETAT.includes(slug);
  const estAlimentation = slug === "alimentation";

  function ajouterPhotos(fichiers: FileList | null) {
    if (!fichiers) return;
    const valides = Array.from(fichiers).filter((f) => TYPES_IMAGE.includes(f.type));
    if (valides.length < fichiers.length) setErreur("Certaines photos ont été ignorées : formats acceptés JPG, PNG ou WEBP.");
    const ajout = valides.slice(0, MAX_PHOTOS - photos.length).map((f) => ({ fichier: f, apercu: URL.createObjectURL(f) }));
    setPhotos([...photos, ...ajout]);
  }

  async function publier(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    const f = new FormData(e.currentTarget);
    const titre = String(f.get("titre") ?? "").trim();
    const description = String(f.get("description") ?? "").trim();
    const prixTexte = String(f.get("prix") ?? "").replace(/\s/g, "");
    const etat = avecEtat ? String(f.get("etat") ?? "occasion") : "occasion";
    const disponibilite = estAlimentation ? String(f.get("disponibilite") ?? "tous_les_jours") : null;
    const lieuId = String(f.get("lieu") ?? "");

    if (titre.length < 3) return setErreur("Donne un titre à ton annonce (3 caractères minimum).");
    if (!categorie) return setErreur("Choisis une catégorie.");
    if (!/^\d+$/.test(prixTexte)) return setErreur("Indique un prix en FCFA (uniquement des chiffres, 0 si c'est gratuit).");
    if (photos.length === 0) return setErreur("Ajoute au moins une photo : les annonces avec photo partent beaucoup plus vite.");

    const supabase = createClient();
    const chemins: string[] = [];

    try {
      // 1. Compression et envoi des photos
      for (let i = 0; i < photos.length; i++) {
        setEtape(`Envoi de la photo ${i + 1} sur ${photos.length}…`);
        const image = await compresserImage(photos[i].fichier);
        const chemin = `${userId}/${Date.now()}-${i}.jpg`;
        const { error } = await supabase.storage.from("photos").upload(chemin, image, { contentType: "image/jpeg" });
        if (error) throw new Error("photo");
        chemins.push(chemin);
      }

      // 2. Enregistrement de l'annonce
      setEtape("Publication…");
      const { data, error } = await supabase
        .from("annonces")
        .insert({
          auteur_id: userId,
          titre,
          description: description || null,
          prix: Number(prixTexte),
          etat,
          disponibilite,
          categorie_id: Number(categorie),
          lieu_id: lieuId || null,
          photos: chemins,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message.includes("interdit") ? error.message : "annonce");

      router.push(`/annonces/${data.id}`);
      router.refresh();
    } catch (err) {
      // On retire les photos déjà envoyées pour ne pas laisser de fichiers orphelins
      if (chemins.length) await supabase.storage.from("photos").remove(chemins);
      const message = err instanceof Error ? err.message : "";
      setErreur(
        message === "photo"
          ? "Une photo n'a pas pu être envoyée. Vérifie ta connexion et réessaie."
          : message.includes("interdit")
            ? message
            : "L'annonce n'a pas pu être publiée. Réessaie dans un instant."
      );
      setEtape(null);
    }
  }

  return (
    <form onSubmit={publier} className="flex flex-col gap-5" noValidate>
      {/* Photos */}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[13px] font-semibold">Photos ({photos.length}/{MAX_PHOTOS})</legend>
        <div className="grid grid-cols-3 gap-2.5">
          {photos.map((p, i) => (
            <div key={p.apercu} className="relative aspect-square overflow-hidden rounded-xl bg-gris-clair">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.apercu} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                aria-label={`Retirer la photo ${i + 1}`}
                className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-encre/80 text-white"
              >
                ✕
              </button>
              {i === 0 && <span className="absolute bottom-1.5 left-1.5 rounded bg-white/90 px-1.5 text-[10px] font-bold">Principale</span>}
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] border-dashed border-[#9aa8a1] bg-white text-xs font-semibold text-[#36423d]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="6" width="18" height="14" rx="2" />
                <circle cx="12" cy="13" r="3.5" />
                <path d="M8 6l1.5-2h5L16 6" />
              </svg>
              Ajouter
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={(e) => {
                  ajouterPhotos(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
      </fieldset>

      <Champ label="Titre" name="titre" maxLength={100} placeholder="Ex. Livre Analyse L1" />

      {/* Catégorie */}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[13px] font-semibold">Catégorie</legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const actif = String(c.id) === categorie;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={actif}
                onClick={() => setCategorie(String(c.id))}
                className={`rounded-full border px-4 py-2 text-[13px] font-semibold ${actif ? "border-encre bg-encre text-white" : "border-bord bg-white"}`}
              >
                {c.nom}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className={avecEtat || estAlimentation ? "grid grid-cols-2 gap-3" : "grid grid-cols-1 gap-3"}>
        <Champ label="Prix (FCFA)" name="prix" inputMode="numeric" placeholder="3000" />
        {estAlimentation ? (
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
            Disponible
            <select name="disponibilite" className={`${styleChamp} h-12`} defaultValue="tous_les_jours">
              <option value="tous_les_jours">{DISPONIBILITES.tous_les_jours}</option>
              <option value="aujourdhui">{DISPONIBILITES.aujourdhui}</option>
            </select>
          </label>
        ) : (
          avecEtat && (
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
              État
              <select name="etat" className={`${styleChamp} h-12`} defaultValue="occasion">
                <option value="occasion">Occasion</option>
                <option value="neuf">Neuf</option>
              </select>
            </label>
          )
        )}
      </div>
      {estAlimentation && (
        <p className="-mt-3 text-xs text-gris">« Aujourd&apos;hui seulement » : ton annonce disparaît de la liste après 24 heures.</p>
      )}

      <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
        Description
        <textarea name="description" rows={4} maxLength={2000} placeholder="État, détails utiles, ce qui est inclus…" className={`${styleChamp} resize-none py-3`} />
      </label>

      <ChoixLieu lieux={lieux} populaires={lieuxPopulaires} initial={dernierLieu} />

      <p className="text-xs leading-relaxed text-gris">
        Interdit : armes, médicaments, produits illicites, codifications. Les annonces signalées sont vérifiées par l&apos;équipe.
      </p>

      {erreur && <Alerte type="erreur">{erreur}</Alerte>}

      <Bouton type="submit" chargement={!!etape}>
        Publier l&apos;annonce
      </Bouton>
      {etape && <p className="-mt-2 text-center text-[13px] text-gris">{etape}</p>}
    </form>
  );
}
