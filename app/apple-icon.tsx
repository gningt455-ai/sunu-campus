import { ImageResponse } from "next/og";

// Icône affichée quand on ajoute Sunu Campus à l'écran d'accueil de l'iPhone
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function IconeApple() {
  // L'iPhone arrondit lui-même les coins : fond vert plein, sans coins arrondis
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0e6b4e" }}>
        <svg width="180" height="180" viewBox="0 0 48 48">
          <rect width="48" height="48" fill="#0e6b4e" />
          <circle cx="24" cy="19" r="8" fill="#f4b400" />
          <path d="M8 24 24 15l16 9z" fill="#fff" />
          <rect x="12" y="26" width="3.2" height="9" fill="#fff" />
          <rect x="18.5" y="26" width="3.2" height="9" fill="#fff" />
          <rect x="26.3" y="26" width="3.2" height="9" fill="#fff" />
          <rect x="32.8" y="26" width="3.2" height="9" fill="#fff" />
          <rect x="9" y="36" width="30" height="3" rx="1" fill="#fff" />
        </svg>
      </div>
    ),
    size
  );
}
