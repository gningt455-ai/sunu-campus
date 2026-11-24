import { ImageResponse } from "next/og";

// Image d'aperçu affichée quand le lien est partagé (WhatsApp, Facebook, Google…)
export const alt = "Sunu Campus — La plateforme des étudiants de l'UCAD";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function ImageApercu() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#0e6b4e",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              background: "#f4b400",
              color: "#14201b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
              fontWeight: 800,
            }}
          >
            SC
          </div>
          <div style={{ fontSize: 52, fontWeight: 800 }}>Sunu Campus</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.1, maxWidth: 1000 }}>La plateforme des étudiants de l&apos;UCAD</div>
          <div style={{ fontSize: 32, color: "#d7ebe2", maxWidth: 1000 }}>
            Annonces · Objets perdus · Messages anonymes · Découvrir le campus
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 28, color: "#f4b400", fontWeight: 700 }}>Réservée aux étudiants vérifiés</div>
      </div>
    ),
    size
  );
}
