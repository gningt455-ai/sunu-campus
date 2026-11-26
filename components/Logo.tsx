import Link from "next/link";
import MarqueSunuCampus from "@/components/MarqueSunuCampus";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Sunu Campus, accueil">
      <MarqueSunuCampus taille={40} className="flex-none" />
      <span className="text-xl font-extrabold tracking-tight">Sunu Campus</span>
    </Link>
  );
}
