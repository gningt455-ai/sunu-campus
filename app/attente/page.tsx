import Link from "next/link";
import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import AlerteCarteTrouvee from "@/components/AlerteCarteTrouvee";
import { cartesTrouveesPour } from "@/lib/objets";
import FormulaireCarte from "@/components/FormulaireCarte";
import { Alerte } from "@/components/Champ";
import { lireSession } from "@/lib/session";
import { deconnexion } from "@/app/actions";

export const dynamic = "force-dynamic";

function Etape({ numero, etat, titre, texte }: { numero: number; etat: "fait" | "encours" | "avenir" | "refuse"; titre: string; texte: string }) {
  const pastille = {
    fait: "bg-vert text-white",
    encours: "bg-jaune text-encre",
    avenir: "bg-gris-clair text-gris",
    refuse: "bg-rouge text-white",
  }[etat];
  return (
    <li className="flex items-start gap-3">
      <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-[13px] font-extrabold ${pastille}`}>
        {etat === "fait" ? "✓" : etat === "refuse" ? "✕" : numero}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-[15px] font-bold">{titre}</span>
        <span className="text-[13px] text-gris">{texte}</span>
      </span>
    </li>
  );
}

export default async function Attente() {
  const { supabase, user, profil } = await lireSession();
  if (!user || !profil) redirect("/connexion");
  if (profil.statut === "verifie") redirect("/");

  const [{ data: demande }, mesCartes] = await Promise.all([
    supabase.from("verifications").select("motif_refus, created_at").eq("user_id", user.id).maybeSingle(),
    cartesTrouveesPour(supabase, profil.prenom, profil.nom),
  ]);
  const refuse = profil.statut === "refuse";
  const bloque = profil.statut === "bloque";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-8">
      <Logo />

      {bloque ? (
        <Alerte type="erreur">
          Ton compte a été bloqué car il ne respecte pas la charte de Sunu Campus. Contacte l&apos;équipe si tu penses que c&apos;est une erreur.
        </Alerte>
      ) : (
        <>
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-extrabold tracking-tight">
              {refuse ? "Ta carte n'a pas été validée" : !demande ? `Il manque ta carte, ${profil.prenom}` : `Demande envoyée, ${profil.prenom}`}
            </h1>
            <p className="text-[15px] leading-relaxed text-gris">
              {refuse
                ? "Envoie une nouvelle photo de ta carte, bien lisible."
                : !demande
                  ? "Envoie la photo de ta carte étudiant pour finaliser ton inscription."
                  : "L'équipe vérifie ta carte étudiant. Reviens un peu plus tard."}
            </p>
          </div>

          <ol className="flex flex-col gap-4 rounded-2xl border border-[#e1e5e2] bg-white p-5">
            <Etape numero={1} etat="fait" titre="Compte créé" texte="Tes informations sont enregistrées" />
            <Etape
              numero={2}
              etat={refuse ? "refuse" : demande ? "encours" : "avenir"}
              titre="Vérification de la carte"
              texte={refuse ? "Refusée" : demande ? "En cours par l'équipe Sunu Campus" : "Carte pas encore envoyée"}
            />
            <Etape numero={3} etat="avenir" titre="Compte activé" texte="Accès complet : annonces, messages, objets perdus, messages anonymes" />
          </ol>

          {refuse && demande?.motif_refus && <Alerte type="erreur">Motif : {demande.motif_refus}</Alerte>}

          {(refuse || !demande) && (
            <FormulaireCarte userId={user.id} libelle={refuse ? "Renvoyer ma carte" : "Envoyer ma carte"} />
          )}
        </>
      )}

      {!bloque && (
        <Link href="/annonces" className="flex min-h-[52px] items-center justify-center rounded-xl border border-bord bg-white font-bold">
          Parcourir les annonces en attendant
        </Link>
      )}
      {!bloque && <AlerteCarteTrouvee objets={mesCartes} />}
      {!bloque && (
        <Link href="/objets" className="flex min-h-[52px] items-center justify-center rounded-xl border border-bord bg-white font-bold">
          Carte perdue ? Voir les objets trouvés
        </Link>
      )}
      {!bloque && (
        <Link href="/campus" className="flex min-h-[52px] items-center justify-center rounded-xl bg-encre font-bold text-white">
          Découvrir le campus
        </Link>
      )}

      <form action={deconnexion} className="mt-auto">
        <button type="submit" className="w-full py-3 text-sm font-semibold text-gris hover:text-encre">
          Se déconnecter
        </button>
      </form>
    </main>
  );
}
