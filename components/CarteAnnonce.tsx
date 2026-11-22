import Link from "next/link";
import { formatPrix } from "@/lib/format";
import { urlPhoto } from "@/lib/photos";

export type ResumeAnnonce = {
  id: string;
  titre: string;
  prix: number;
  etat: "neuf" | "occasion";
  statut?: string;
  photos: string[];
  lieux: { nom: string; nom_court: string | null } | null;
};

export default function CarteAnnonce({ annonce }: { annonce: ResumeAnnonce }) {
  const photo = annonce.photos[0];
  return (
    <Link
      href={`/annonces/${annonce.id}`}
      className="flex flex-col overflow-hidden rounded-2xl border border-[#e1e5e2] bg-white transition hover:shadow-md"
    >
      <span className="relative block aspect-[4/3] bg-[#dde7e1]">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={urlPhoto(photo)} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-xs text-gris">Pas de photo</span>
        )}
        {annonce.statut === "vendue" && (
          <span className="absolute left-2 top-2 rounded-md bg-encre px-2 py-1 text-[11px] font-bold text-white">Vendue</span>
        )}
      </span>
      <span className="flex flex-col gap-1 p-3">
        <span className="line-clamp-2 text-sm font-semibold leading-snug">{annonce.titre}</span>
        <span className="text-[15px] font-extrabold text-vert">{formatPrix(annonce.prix)}</span>
        <span className="truncate text-[11px] text-gris">
          {annonce.etat === "neuf" ? "Neuf" : "Occasion"}
          {annonce.lieux ? ` · ${annonce.lieux.nom_court ?? annonce.lieux.nom}` : ""}
        </span>
      </span>
    </Link>
  );
}
