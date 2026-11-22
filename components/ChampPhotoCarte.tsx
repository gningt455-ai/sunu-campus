"use client";

import { useState } from "react";

// Bouton « Photo de ma carte étudiant » avec aperçu
export default function ChampPhotoCarte({ onChange }: { onChange: (f: File | null) => void }) {
  const [apercu, setApercu] = useState<string | null>(null);
  const [nom, setNom] = useState<string>("");

  return (
    <label className="flex cursor-pointer flex-col gap-1.5 text-[13px] font-semibold">
      Photo de ta carte étudiant
      <span className="flex min-h-[56px] items-center justify-center gap-3 rounded-xl border-[1.5px] border-dashed border-[#9aa8a1] bg-white p-3 text-sm font-semibold text-encre">
        {apercu ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={apercu} alt="Aperçu de la carte" className="h-16 w-24 rounded-md object-cover" />
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="6" width="18" height="14" rx="2" />
            <circle cx="12" cy="13" r="3.5" />
            <path d="M8 6l1.5-2h5L16 6" />
          </svg>
        )}
        <span className="truncate">{nom || "Prendre ou choisir une photo"}</span>
      </span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          onChange(f);
          setNom(f ? f.name : "");
          setApercu(f ? URL.createObjectURL(f) : null);
        }}
      />
    </label>
  );
}
