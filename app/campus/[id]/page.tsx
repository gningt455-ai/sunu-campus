import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import EnTete from "@/components/EnTete";
import { lireSession } from "@/lib/session";
import { estUuid } from "@/lib/format";
import { urlPhoto } from "@/lib/photos";

export const dynamic = "force-dynamic";

type Histoire = { id: string; titre: string; resume: string | null; contenu: string; couverture: string; photos: string[]; created_at: string; publie: boolean };

export default async function PageHistoire({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!estUuid(id)) notFound();

  const { supabase, user, profil } = await lireSession();
  if (!user || !profil) redirect("/connexion");
  if (profil.statut === "bloque") redirect("/attente");

  const { data } = await supabase
    .from("histoires")
    .select("id, titre, resume, contenu, couverture, photos, created_at, publie")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const h = data as Histoire;

  const paragraphes = h.contenu.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const date = new Date(h.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <EnTete actif="campus" peutPublier={profil.statut === "verifie"} />
      <article className="flex flex-1 flex-col">
        {/* Grande photo de couverture */}
        <div className="relative bg-encre">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urlPhoto(h.couverture)} alt={h.titre} className="max-h-[70vh] w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-3xl flex-col gap-2 px-5 pb-6 text-white">
            {!h.publie && <span className="w-fit rounded-full bg-jaune px-3 py-1 text-xs font-bold text-encre">Brouillon (visible par l&apos;admin seulement)</span>}
            <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">{h.titre}</h1>
            <p className="text-sm text-white/80">Publié le {date}</p>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-8">
          <Link href="/campus" className="text-sm font-semibold text-gris hover:text-encre">
            ← Toutes les histoires
          </Link>
          {h.resume && <p className="text-xl font-semibold leading-relaxed text-encre">{h.resume}</p>}
          <div className="flex flex-col gap-5 text-[17px] leading-[1.75] text-[#2b3832]">
            {paragraphes.map((p, i) => (
              <p key={i} className="whitespace-pre-line">
                {p}
              </p>
            ))}
          </div>

          {h.photos.length > 0 && (
            <section className="flex flex-col gap-3 pt-4">
              <h2 className="text-lg font-extrabold">En images</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {h.photos.map((p, i) => (
                  <a key={p} href={urlPhoto(p)} target="_blank" rel="noreferrer" className={`overflow-hidden rounded-xl bg-[#dde7e1] ${i === 0 ? "col-span-2 row-span-2" : ""}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={urlPhoto(p)} alt={`${h.titre}, photo ${i + 1}`} loading="lazy" className="aspect-square h-full w-full object-cover transition hover:scale-[1.03]" />
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
    </>
  );
}
