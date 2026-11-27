import Link from "next/link";
import { formatPrix } from "@/lib/format";
import { urlPhoto } from "@/lib/photos";
import { libelleEtat, type Disponibilite } from "@/lib/annonces";

export type ResumeAnnonce = {
  id: string;
  titre: string;
  prix: number;
  etat: "neuf" | "occasion";
  disponibilite?: Disponibilite | null;
  created_at?: string;
  categories?: { slug: string } | null;
  statut?: string;
  photos: string[];
  lieux: { nom: string; nom_court: string | null } | null;
};

export default function CarteAnnonce({ annonce }: { annonce: ResumeAnnonce }) {
  const photo = annonce.photos[0];
  const vendue = annonce.statut === "vendue";
  return (
    <Link
      href={`/annonces/${annonce.id}`}
      className={`flex flex-col overflow-hidden rounded-2xl border border-[#e1e5e2] bg-white transition hover:shadow-md ${vendue ? "opacity-75" : ""}`}
    >
      <span className="relative block aspect-[4/3] bg-[#dde7e1]">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={urlPhoto(photo)} alt="" loading="lazy" className={`h-full w-full object-cover ${vendue ? "grayscale" : ""}`} />
        ) : (
          <span className="flex h-full items-center justify-center text-xs text-gris">Pas de photo</span>
        )}
        {vendue && (
          <span className="absolute inset-0 flex items-center justify-center bg-encre/35">
            <span className="-rotate-12 rounded-md border-2 border-white bg-rouge px-3 py-1 text-base font-extrabold tracking-widest text-white shadow">
              VENDU
            </span>
          </span>
        )}
      </span>
      <span className="flex flex-col gap-1 p-3">
        <span className="line-clamp-2 text-sm font-semibold leading-snug">{annonce.titre}</span>
        <span className={`text-[15px] font-extrabold ${vendue ? "text-gris line-through" : "text-vert"}`}>{formatPrix(annonce.prix)}</span>
        <span className="truncate text-[11px] text-gris">
          {[libelleEtat(annonce), annonce.lieux ? (annonce.lieux.nom_court ?? annonce.lieux.nom) : null].filter(Boolean).join(" · ")}
        </span>
      </span>
    </Link>
  );
}
