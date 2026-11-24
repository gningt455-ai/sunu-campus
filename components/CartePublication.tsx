import Link from "next/link";
import IconeMasque from "@/components/IconeMasque";
import { ilYa } from "@/lib/format";
import { CATEGORIES_MUR, MOTIFS_MUR, type Publication } from "@/lib/mur";
import { basculerReaction, signaler, supprimerPublication } from "@/app/mur/actions";

// Un message anonyme (liste ou page de détail)
export default function CartePublication({ p, retour, detail = false }: { p: Publication; retour: string; detail?: boolean }) {
  const cat = CATEGORIES_MUR[p.categorie] ?? CATEGORIES_MUR.question;
  const texte = !detail && p.texte.length > 320 ? `${p.texte.slice(0, 320)}…` : p.texte;

  return (
    <article className={`flex flex-col gap-4 rounded-3xl border p-5 ${cat.carte}`}>
      {/* Avatar masqué + catégorie */}
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-encre text-white">
          <IconeMasque taille={22} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-extrabold">{p.est_a_moi ? "Toi (anonyme)" : "Anonyme"}</span>
          <span className="text-xs text-gris">{ilYa(p.created_at)}</span>
        </span>
        <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${cat.badge}`}>{cat.nom}</span>
      </div>

      {/* Texte façon citation */}
      {detail ? (
        <p className="whitespace-pre-line text-[19px] font-semibold leading-relaxed text-encre">{texte}</p>
      ) : (
        <Link href={`/mur/${p.id}`} className="whitespace-pre-line text-[17px] font-semibold leading-relaxed text-encre">
          {texte}
          {p.texte.length > 320 && <span className="ml-1 text-sm font-bold text-vert">Lire la suite</span>}
        </Link>
      )}

      {/* Actions */}
      <div className="-mb-1 -ml-2 flex items-center gap-1 border-t border-black/5 pt-2">
        <form action={basculerReaction.bind(null, p.id, p.j_aime, retour)}>
          <button
            aria-pressed={p.j_aime}
            aria-label={p.j_aime ? "Retirer mon j'aime" : "J'aime"}
            className={`flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-bold hover:bg-white/70 ${p.j_aime ? "text-rouge" : "text-[#36423d]"}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={p.j_aime ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
            </svg>
            {p.nb_reactions}
          </button>
        </form>
        <Link href={`/mur/${p.id}#commentaires`} className="flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-[#36423d] hover:bg-white/70">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
          </svg>
          {p.nb_commentaires} {detail ? "" : p.nb_commentaires > 1 ? "réponses" : "réponse"}
        </Link>

        <span className="ml-auto">
          {p.est_a_moi ? (
            <details className="relative">
              <summary className="flex h-10 cursor-pointer list-none items-center rounded-full px-3 text-[13px] font-semibold text-gris hover:bg-white/70">Supprimer</summary>
              <form action={supprimerPublication.bind(null, p.id)} className="absolute right-0 z-10 mt-1 w-44 rounded-lg border border-bord bg-white p-2 shadow-md">
                <button className="h-9 w-full rounded-md bg-rouge text-xs font-bold text-white">Oui, supprimer</button>
              </form>
            </details>
          ) : (
            <details className="relative">
              <summary aria-label="Signaler" className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full text-gris hover:bg-white/70">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 21V4h11l-1.5 4L16 12H5" />
                </svg>
              </summary>
              <form action={signaler.bind(null, "publication", p.id, retour)} className="absolute right-0 z-10 mt-1 flex w-60 flex-col gap-2 rounded-lg border border-bord bg-white p-2 shadow-md">
                <label className="text-xs font-bold text-gris" htmlFor={`motif-${p.id}`}>
                  Pourquoi signaler ?
                </label>
                <select id={`motif-${p.id}`} name="motif" className="h-10 rounded-md border border-bord bg-white px-2 text-sm">
                  {MOTIFS_MUR.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
                <button className="h-9 rounded-md bg-rouge text-xs font-bold text-white">Signaler</button>
              </form>
            </details>
          )}
        </span>
      </div>
    </article>
  );
}
