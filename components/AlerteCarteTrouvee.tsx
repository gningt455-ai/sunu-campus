import Link from "next/link";

// Bandeau affiché quand une carte trouvée porte le nom de l'étudiant connecté
export default function AlerteCarteTrouvee({ objets }: { objets: { id: string; titre: string }[] }) {
  if (objets.length === 0) return null;
  return (
    <div role="status" className="flex flex-col gap-2 rounded-2xl border-2 border-jaune bg-jaune-clair p-4">
      <span className="text-[15px] font-extrabold text-encre">Une carte à ton nom a peut-être été trouvée !</span>
      <span className="text-[13px] leading-relaxed text-[#5e3d00]">
        Un étudiant a déclaré avoir trouvé une carte ou une pièce qui porte ton nom. Contacte-le pour la récupérer.
      </span>
      <div className="flex flex-wrap gap-2">
        {objets.map((o) => (
          <Link key={o.id} href={`/objets/${o.id}`} className="rounded-lg bg-encre px-3 py-2 text-[13px] font-bold text-white">
            Voir : {o.titre}
          </Link>
        ))}
      </div>
    </div>
  );
}
