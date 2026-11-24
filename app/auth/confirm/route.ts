// Lien reçu par e-mail (mot de passe oublié, confirmation d'adresse) :
// on valide le jeton auprès de Supabase, ce qui ouvre la session, puis on redirige.
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  // Sécurité : on ne redirige que vers une page de Sunu Campus
  const destination = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  const supabase = await createClient();
  let valide = false;
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    valide = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    valide = !error;
  }

  return NextResponse.redirect(`${origin}${valide ? destination : "/mot-de-passe-oublie?lien=expire"}`);
}
