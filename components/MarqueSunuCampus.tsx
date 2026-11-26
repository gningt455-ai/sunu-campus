// Marque Sunu Campus : le soleil qui se lève derrière le campus (bâtiment à colonnes)
export default function MarqueSunuCampus({ taille = 40, className }: { taille?: number; className?: string }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect width="48" height="48" rx="12" fill="#0e6b4e" />
      <circle cx="24" cy="19" r="8" fill="#f4b400" />
      <path d="M8 24 24 15l16 9z" fill="#fff" />
      <rect x="12" y="26" width="3.2" height="9" fill="#fff" />
      <rect x="18.5" y="26" width="3.2" height="9" fill="#fff" />
      <rect x="26.3" y="26" width="3.2" height="9" fill="#fff" />
      <rect x="32.8" y="26" width="3.2" height="9" fill="#fff" />
      <rect x="9" y="36" width="30" height="3" rx="1" fill="#fff" />
    </svg>
  );
}
