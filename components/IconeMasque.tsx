// Icône de masque : symbole des messages anonymes
export default function IconeMasque({ taille = 22 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8.5c2.5-1.3 5.5-1.8 9-1.8s6.5.5 9 1.8v2.2c0 4.2-2.6 7.3-5.6 7.3-1.6 0-2.6-1.3-3.4-2.6-.8 1.3-1.8 2.6-3.4 2.6C5.6 18 3 14.9 3 10.7z" />
      <path d="M7 11.2c.7-.6 1.6-.6 2.4 0M14.6 11.2c.7-.6 1.6-.6 2.4 0" />
    </svg>
  );
}
