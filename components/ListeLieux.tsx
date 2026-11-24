import { lieuxParType, type Lieu } from "@/lib/lieux";

// <option> groupées par type de lieu, à placer dans un <select>
export default function OptionsLieux({ lieux }: { lieux: Lieu[] }) {
  return (
    <>
      {lieuxParType(lieux).map((g) => (
        <optgroup key={g.type} label={g.titre}>
          {g.lieux.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nom}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}
