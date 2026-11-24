// Affiché immédiatement pendant le chargement d'une page :
// l'étudiant voit tout de suite que son clic a été pris en compte.
export default function Chargement() {
  return (
    <div className="flex flex-1 flex-col" aria-busy="true" aria-live="polite">
      <div className="h-[3px] w-full overflow-hidden bg-vert-clair">
        <div className="h-full w-1/3 animate-[chargement_1s_ease-in-out_infinite] bg-vert" />
      </div>
      <span className="sr-only">Chargement…</span>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gris-clair" />
        <div className="h-12 w-full animate-pulse rounded-xl bg-gris-clair" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-2xl border border-[#e1e5e2] bg-white p-3">
              <div className="aspect-[4/3] animate-pulse rounded-xl bg-gris-clair" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-gris-clair" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-gris-clair" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
