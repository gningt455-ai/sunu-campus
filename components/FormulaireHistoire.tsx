"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alerte, Bouton, Champ } from "@/components/Champ";
import { compresserImage } from "@/lib/photos";
import { TYPES_IMAGE } from "@/lib/constantes";
import { createClient } from "@/lib/supabase/client";

const MAX_GALERIE = 12;
const styleChamp =
  "w-full rounded-xl border border-bord bg-white px-3 py-3 text-[15px] font-normal text-encre outline-none focus:border-vert focus:ring-2 focus:ring-vert/20";

type Photo = { fichier: File; apercu: string };

export default function FormulaireHistoire({ userId }: { userId: string }) {
  const router = useRouter();
  const [couverture, setCouverture] = useState<Photo | null>(null);
  const [galerie, setGalerie] = useState<Photo[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [etape, setEtape] = useState<string | null>(null);

  const versPhotos = (fichiers: FileList | null) =>
    Array.from(fichiers ?? [])
      .filter((f) => TYPES_IMAGE.includes(f.type))
      .map((f) => ({ fichier: f, apercu: URL.createObjectURL(f) }));

  async function publier(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    setSucces(null);
    const form = e.currentTarget;
    const f = new FormData(form);
    const titre = String(f.get("titre") ?? "").trim();
    const resume = String(f.get("resume") ?? "").trim();
    const contenu = String(f.get("contenu") ?? "").trim();
    const publie = f.get("publie") === "on";

    if (titre.length < 3) return setErreur("Donne un titre à l'histoire.");
    if (contenu.length < 10) return setErreur("Écris le texte de l'histoire.");
    if (!couverture) return setErreur("Choisis une photo de couverture.");

    const supabase = createClient();
    const envoyes: string[] = [];
    const toutes = [couverture, ...galerie];

    try {
      // Photos en haute qualité (1920 px) : c'est une vitrine
      for (let i = 0; i < toutes.length; i++) {
        setEtape(`Envoi de la photo ${i + 1} sur ${toutes.length}…`);
        const image = await compresserImage(toutes[i].fichier, 1920, 0.85);
        const chemin = `${userId}/campus-${Date.now()}-${i}.jpg`;
        const { error } = await supabase.storage.from("photos").upload(chemin, image, { contentType: "image/jpeg" });
        if (error) throw new Error("photo");
        envoyes.push(chemin);
      }

      setEtape("Enregistrement…");
      const { error } = await supabase.from("histoires").insert({
        auteur_id: userId,
        titre,
        resume: resume || null,
        contenu,
        couverture: envoyes[0],
        photos: envoyes.slice(1),
        publie,
      });
      if (error) throw new Error("histoire");

      form.reset();
      setCouverture(null);
      setGalerie([]);
      setEtape(null);
      setSucces(publie ? "Histoire publiée !" : "Brouillon enregistré.");
      router.refresh();
    } catch (err) {
      if (envoyes.length) await supabase.storage.from("photos").remove(envoyes);
      setEtape(null);
      setErreur(
        err instanceof Error && err.message === "photo"
          ? "Une photo n'a pas pu être envoyée. Vérifie ta connexion et réessaie."
          : "L'histoire n'a pas pu être enregistrée. Réessaie."
      );
    }
  }

  return (
    <form onSubmit={publier} className="flex flex-col gap-4 rounded-2xl border border-[#e1e5e2] bg-white p-4" noValidate>
      {/* Couverture */}
      <label className="flex cursor-pointer flex-col gap-1.5 text-[13px] font-semibold">
        Photo de couverture
        <span className="relative flex aspect-[16/8] items-center justify-center overflow-hidden rounded-xl border-[1.5px] border-dashed border-[#9aa8a1] bg-fond text-sm text-gris">
          {couverture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={couverture.apercu} alt="Aperçu de la couverture" className="h-full w-full object-cover" />
          ) : (
            "Choisir une belle photo (format paysage de préférence)"
          )}
        </span>
        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => setCouverture(versPhotos(e.target.files)[0] ?? null)} />
      </label>

      <Champ label="Titre" name="titre" maxLength={120} placeholder="Ex. Le campus social au coucher du soleil" />

      <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
        Résumé (facultatif, 300 caractères)
        <textarea name="resume" rows={2} maxLength={300} placeholder="Une ou deux phrases qui donnent envie de lire." className={`${styleChamp} resize-none`} />
      </label>

      <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
        Texte de l&apos;histoire
        <textarea
          name="contenu"
          rows={10}
          maxLength={20000}
          placeholder={"Raconte le lieu, son histoire, ses anecdotes…\n\nLaisse une ligne vide entre deux paragraphes."}
          className={`${styleChamp} resize-y`}
        />
      </label>

      {/* Galerie */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold">
          Galerie ({galerie.length}/{MAX_GALERIE})
        </span>
        <div className="grid grid-cols-4 gap-2">
          {galerie.map((p, i) => (
            <div key={p.apercu} className="relative aspect-square overflow-hidden rounded-lg bg-gris-clair">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.apercu} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setGalerie(galerie.filter((_, j) => j !== i))}
                aria-label={`Retirer la photo ${i + 1}`}
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-encre/80 text-xs text-white"
              >
                ✕
              </button>
            </div>
          ))}
          {galerie.length < MAX_GALERIE && (
            <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-[1.5px] border-dashed border-[#9aa8a1] text-2xl text-gris">
              +
              <span className="sr-only">Ajouter des photos à la galerie</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={(e) => {
                  setGalerie([...galerie, ...versPhotos(e.target.files)].slice(0, MAX_GALERIE));
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm font-semibold">
        <input type="checkbox" name="publie" defaultChecked className="h-5 w-5 accent-[#0e6b4e]" />
        Publier tout de suite (sinon : brouillon)
      </label>

      {erreur && <Alerte type="erreur">{erreur}</Alerte>}
      {succes && <Alerte type="succes">{succes}</Alerte>}

      <Bouton type="submit" chargement={!!etape}>
        Enregistrer l&apos;histoire
      </Bouton>
      {etape && <p className="-mt-2 text-center text-[13px] text-gris">{etape}</p>}
    </form>
  );
}
