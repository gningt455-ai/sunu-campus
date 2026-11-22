import Link from "next/link";
import { redirect } from "next/navigation";
import EnTete from "@/components/EnTete";
import { lireSession } from "@/lib/session";
import { urlPhoto } from "@/lib/photos";

export const dynamic = "force-dynamic";

type Histoire = { id: string; titre: string; resume: string | null; couverture: string; photos: string[] };

export default async function DecouvrirCampus() {
  const { supabase, user, profil } = await lireSession();
  if (!user || !profil) redirect("/connexion");
  if (profil.statut === "bloque") redirect("/attente");

  const { data } = await supabase
    .from("histoires")
    .select("id, titre, resume, couverture, photos")
    .eq("publie", true)
    .order("created_at", { ascending: false });
  const histoires = (data ?? []) as Histoire[];
  const [une, ...autres] = histoires;

  return (
    <>
      <EnTete actif="campus" peutPublier={profil.statut === "verifie"} />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold uppercase tracking-wide text-vert">Découvrir le campus</span>
          <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">La beauté de l&apos;UCAD, racontée par ses étudiants</h1>
        </div>

        {!une ? (
          <div className="rounded-2xl border border-[#e1e5e2] bg-white p-8 text-center text-gris">
            Les premières histoires du campus arrivent bientôt.
            {profil.role === "admin" && (
              <Link href="/admin/campus" className="mt-2 block font-bold text-vert">
                Publier la première histoire
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Histoire à la une */}
            <Link href={`/campus/${une.id}`} className="group relative block overflow-hidden rounded-3xl bg-encre">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={urlPhoto(une.couverture)}
                alt=""
                className="aspect-[4/5] w-full object-cover opacity-90 transition duration-500 group-hover:scale-[1.02] sm:aspect-[16/8]"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5 text-white sm:p-8">
                <span className="w-fit rounded-full bg-jaune px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-encre">À la une</span>
                <span className="text-2xl font-extrabold leading-tight sm:text-4xl">{une.titre}</span>
                {une.resume && <span className="max-w-2xl text-[15px] leading-relaxed text-white/90">{une.resume}</span>}
              </span>
            </Link>

            {/* Autres histoires */}
            {autres.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {autres.map((h) => (
                  <Link key={h.id} href={`/campus/${h.id}`} className="group flex flex-col overflow-hidden rounded-2xl border border-[#e1e5e2] bg-white">
                    <span className="block aspect-[4/3] overflow-hidden bg-[#dde7e1]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={urlPhoto(h.couverture)} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                    </span>
                    <span className="flex flex-col gap-1.5 p-4">
                      <span className="text-[17px] font-extrabold leading-snug">{h.titre}</span>
                      {h.resume && <span className="line-clamp-3 text-[13px] leading-relaxed text-gris">{h.resume}</span>}
                      <span className="text-xs font-semibold text-vert">
                        {h.photos.length + 1} photo{h.photos.length > 0 ? "s" : ""}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
