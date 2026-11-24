// Photos des annonces, objets et histoires (bucket public « photos »)

// Adresse publique d'une photo à partir de son chemin dans le bucket
export function urlPhoto(chemin: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${chemin}`;
}

// Réduit une photo (1280 px max, JPEG) avant l'envoi : plus rapide et moins de données mobiles.
// À utiliser uniquement dans le navigateur.
export async function compresserImage(fichier: File, tailleMax = 1280, qualite = 0.8): Promise<Blob> {
  const image = await createImageBitmap(fichier);
  const ratio = Math.min(1, tailleMax / Math.max(image.width, image.height));
  const largeur = Math.round(image.width * ratio);
  const hauteur = Math.round(image.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = largeur;
  canvas.height = hauteur;
  const contexte = canvas.getContext("2d");
  if (!contexte) throw new Error("Compression impossible");
  contexte.drawImage(image, 0, 0, largeur, hauteur);
  image.close();

  return await new Promise<Blob>((ok, echec) =>
    canvas.toBlob((blob) => (blob ? ok(blob) : echec(new Error("Compression impossible"))), "image/jpeg", qualite)
  );
}
