// Petits composants de formulaire réutilisables
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

const styleChamp =
  "h-12 w-full min-w-0 rounded-xl border border-bord bg-white px-3 text-[15px] font-normal text-encre outline-none placeholder:text-[#6b7872] focus:border-vert focus:ring-2 focus:ring-vert/20";

export function Champ({ label, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
      {label}
      <input className={styleChamp} {...props} />
    </label>
  );
}

export function Liste({
  label,
  options,
  ...props
}: { label: string; options: string[] } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
      {label}
      <select className={styleChamp} {...props}>
        <option value="">Choisir…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Alerte({ type, children }: { type: "erreur" | "info" | "succes"; children: ReactNode }) {
  const couleurs = {
    erreur: "bg-rouge-clair text-rouge",
    info: "bg-jaune-clair text-[#5e3d00]",
    succes: "bg-vert-clair text-vert-fonce",
  }[type];
  return (
    <div role={type === "erreur" ? "alert" : "status"} className={`rounded-xl p-3 text-[13px] leading-relaxed ${couleurs}`}>
      {children}
    </div>
  );
}

export function Bouton({
  chargement,
  children,
  ...props
}: { chargement?: boolean; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={chargement || props.disabled}
      className="min-h-[52px] w-full rounded-xl bg-vert text-base font-bold text-white transition hover:bg-vert-fonce disabled:cursor-not-allowed disabled:opacity-60"
    >
      {chargement ? "Patiente…" : children}
    </button>
  );
}
