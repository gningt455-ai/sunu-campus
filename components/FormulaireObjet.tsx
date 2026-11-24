"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alerte, Bouton, Champ } from "@/components/Champ";
import { compresserImage } from "@/lib/photos";
import { TYPES_IMAGE } from "@/lib/constantes";
import { CATEGORIES_OBJET, SANS_PHOTO, type CategorieObjet, type SensObjet } from "@/lib/objets";
import { createClient } from "@/lib/supabase/client";
import OptionsLieux from "@/components/ListeLieux";
import type { Lieu } from "@/lib/lieux";

const styleChamp =
  "w-full rounded-xl border border-bord bg-white px-3 text-[15px] font-normal text-encre outline-none focus:border-vert focus:ring-2 focus:ring-vert/20";

export default function FormulaireObjet({
  userId,
  lieux,
  sensInitial,
}: {
  userId: string;
  lieux: Lieu[];
  sensInitial: SensObjet;
}) {
  const router = useRouter();
  const [sens, setSens] = useState<SensObjet>(sensInitial);
  const [categorie, setCategorie] = useState<CategorieObjet>("carte_etudiant");
  const [photo, setPhoto] = useState<{ fichier: File; apercu: string } | null>(null);
  const [lieu, setLieu] = useState<string>("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [etape, setEtape] = useState<string | null>(null);

  const estPiece = SANS_PHOTO.includes(categorie);
  const aujourdhui = new Date().toISOString().slice(0, 10);

  async function envoyer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    const f = new FormData(e.currentTarget);
    const nomSurCarte = String(f.get("nom_sur_carte") ?? "").trim();
    const titreSaisi = String(f.get("titre") ?? "").trim();
    const lieuTexte = String(f.get("lieu_texte") ?? "").trim();
    const date = String(f.get("date_evenement") ?? "");
    const description = String(f.get("description") ?? "").trim();

    if (estPiece && nomSurCarte.length < 3) return setErreur("Indique le prénom et le nom écrits sur la carte.");
    if (!estPiece && titreSaisi.length < 3) return setErreur("Décris l'objet en quelques mots (ex. Téléphone Samsung noir).");
    if (!lieu && !lieuTexte) return setErreur("Indique où l'objet a été trouvé ou perdu.");

    const titre = estPiece
      ? `${CATEGORIES_OBJET[categorie]} ${sens === "trouve" ? "trouvée" : "perdue"}`
      : titreSaisi;

    const supabase = createClient();
    let chemin: string | null = null;
    try {
      if (photo && !estPiece) {
        setEtape("Envoi de la photo…");
        const image = await compresserImage(photo.fichier);
        chemin = `${userId}/objet-${Date.now()}.jpg`;
        const { error } = await supabase.storage.from("photos").upload(chemin, image, { contentType: "image/jpeg" });
        if (error) {
          chemin = null;
          throw new Error("photo");
        }
      }

      setEtape("Publication…");
      const { data, error } = await supabase
        .from("objets")
        .insert({
          auteur_id: userId,
          sens,
          categorie,
          titre,
          nom_sur_carte: nomSurCarte || null,
          description: description || null,
          lieu_id: lieu && lieu !== "autre" ? lieu : null,
          lieu_texte: lieu === "autre" || !lieu ? lieuTexte || null : null,
          date_evenement: date || null,
          photo: estPiece ? null : chemin,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message.includes("interdit") ? error.message : "objet");

      router.push(`/objets/${data.id}`);
      router.refresh();
    } catch (err) {
      if (chemin) await supabase.storage.from("photos").remove([chemin]);
      const m = err instanceof Error ? err.message : "";
      setErreur(
        m === "photo" ? "La photo n'a pas pu être envoyée. Réessaie." : m.includes("interdit") ? m : "La déclaration n'a pas pu être enregistrée. Réessaie."
      );
      setEtape(null);
    }
  }

  return (
    <form onSubmit={envoyer} className="flex flex-col gap-5" noValidate>
      {/* J'ai trouvé / J'ai perdu */}
      <div role="group" aria-label="Type de déclaration" className="grid grid-cols-2 gap-1.5 rounded-2xl bg-gris-clair p-1">
        {(["trouve", "perdu"] as const).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={sens === s}
            onClick={() => setSens(s)}
            className={`h-12 rounded-xl text-sm font-bold ${sens === s ? "bg-white text-vert shadow-sm" : "text-gris"}`}
          >
            {s === "trouve" ? "J'ai trouvé" : "J'ai perdu"}
          </button>
        ))}
      </div>

      {/* Catégorie */}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[13px] font-semibold">Quel objet ?</legend>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORIES_OBJET).map(([cle, nom]) => (
            <button
              key={cle}
              type="button"
              aria-pressed={categorie === cle}
              onClick={() => {
                setCategorie(cle as CategorieObjet);
                if (SANS_PHOTO.includes(cle as CategorieObjet)) setPhoto(null);
              }}
              className={`rounded-full border px-4 py-2 text-[13px] font-semibold ${categorie === cle ? "border-encre bg-encre text-white" : "border-bord bg-white"}`}
            >
              {nom}
            </button>
          ))}
        </div>
      </fieldset>

      {estPiece ? (
        <>
          <Champ
            label={sens === "trouve" ? "Nom écrit sur la carte" : "Ton nom, tel qu'il est écrit sur la carte"}
            name="nom_sur_carte"
            maxLength={80}
            placeholder="Prénom et nom"
            autoComplete="off"
          />
          <Alerte type="info">
            {sens === "trouve"
              ? "Par respect pour son propriétaire, ne publie pas de photo de la carte et n'écris pas son numéro. Garde-la en lieu sûr jusqu'à ce qu'il te contacte."
              : "Les photos de cartes ne sont pas autorisées. Si quelqu'un trouve ta carte, une alerte s'affichera sur ton accueil."}
          </Alerte>
        </>
      ) : (
        <>
          <Champ label="Objet" name="titre" maxLength={100} placeholder="Ex. Téléphone Samsung noir, trousseau de 3 clés…" />
          <label className="flex cursor-pointer flex-col gap-1.5 text-[13px] font-semibold">
            Photo (facultatif)
            <span className="flex min-h-[64px] items-center justify-center gap-3 rounded-xl border-[1.5px] border-dashed border-[#9aa8a1] bg-white p-2 text-sm text-gris">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.apercu} alt="Aperçu" className="h-20 w-28 rounded-lg object-cover" />
              ) : (
                "Ajouter une photo de l'objet"
              )}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                const x = e.target.files?.[0];
                setPhoto(x && TYPES_IMAGE.includes(x.type) ? { fichier: x, apercu: URL.createObjectURL(x) } : null);
              }}
            />
          </label>
        </>
      )}

      {/* Lieu */}
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
        {sens === "trouve" ? "Où l'as-tu trouvé ?" : "Où l'as-tu perdu ?"}
        <select value={lieu} onChange={(e) => setLieu(e.target.value)} className={`${styleChamp} h-12`}>
          <option value="">Choisir un lieu…</option>
          <OptionsLieux lieux={lieux} />
          <option value="autre">Autre lieu (à préciser)</option>
        </select>
      </label>
      {(lieu === "autre" || !lieu) && (
        <Champ label="Précise le lieu" name="lieu_texte" maxLength={100} placeholder="Ex. Place Omar Pène, devant le pavillon G…" />
      )}

      <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
        Date
        <input type="date" name="date_evenement" max={aujourdhui} defaultValue={aujourdhui} className={`${styleChamp} h-12`} />
      </label>

      <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
        Détails (facultatif)
        <textarea
          name="description"
          rows={3}
          maxLength={1000}
          placeholder={sens === "trouve" ? "Où peut-on la récupérer ? À quelle heure es-tu disponible ?" : "Signes distinctifs, heure approximative…"}
          className={`${styleChamp} resize-none py-3`}
        />
      </label>

      {erreur && <Alerte type="erreur">{erreur}</Alerte>}

      <Bouton type="submit" chargement={!!etape}>
        Publier la déclaration
      </Bouton>
    </form>
  );
}
