"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export type Message = { id: string; expediteur_id: string; texte: string; created_at: string; lu?: boolean; enEchec?: boolean };

function heure(date: string) {
  return new Date(date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function jour(date: string) {
  const d = new Date(date);
  const aujourdhui = new Date();
  const hier = new Date();
  hier.setDate(aujourdhui.getDate() - 1);
  if (d.toDateString() === aujourdhui.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === hier.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

export default function Conversation({
  conversationId,
  moi,
  messagesInitiaux,
}: {
  conversationId: string;
  moi: string;
  messagesInitiaux: Message[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Message[]>(messagesInitiaux);
  const [texte, setTexte] = useState("");
  const fin = useRef<HTMLDivElement>(null);

  // Marquer comme lus les messages reçus
  async function marquerLus() {
    await supabase
      .from("messages")
      .update({ lu: true })
      .eq("conversation_id", conversationId)
      .neq("expediteur_id", moi)
      .eq("lu", false);
  }

  // Temps réel : chaque nouveau message de la conversation s'affiche aussitôt
  useEffect(() => {
    marquerLus();
    const canal = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((liste) => (liste.some((x) => x.id === m.id) ? liste : [...liste, m]));
          if (m.expediteur_id !== moi) marquerLus();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Défilement automatique vers le dernier message
  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function envoyer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const contenu = texte.trim();
    if (!contenu) return;
    setTexte("");

    // Affichage immédiat, avant la réponse du serveur
    const temporaire: Message = { id: `tmp-${Date.now()}`, expediteur_id: moi, texte: contenu, created_at: new Date().toISOString() };
    setMessages((liste) => [...liste, temporaire]);

    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, expediteur_id: moi, texte: contenu })
      .select("id, expediteur_id, texte, created_at")
      .single();

    setMessages((liste) => {
      if (error || !data) return liste.map((m) => (m.id === temporaire.id ? { ...m, enEchec: true } : m));
      // Le temps réel a peut-être déjà ajouté le vrai message : on évite le doublon
      const sansTemp = liste.filter((m) => m.id !== temporaire.id);
      return sansTemp.some((m) => m.id === data.id) ? sansTemp : [...sansTemp, data as Message];
    });
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto bg-fond">
        <div className="mx-auto flex max-w-2xl flex-col gap-1.5 px-4 py-4">
          {messages.length === 0 && (
            <p className="py-10 text-center text-sm text-gris">
              Écris ton premier message : présente-toi et propose un lieu et une heure de rencontre sur le campus.
            </p>
          )}
          {messages.map((m, i) => {
            const aMoi = m.expediteur_id === moi;
            const nouveauJour = i === 0 || jour(messages[i - 1].created_at) !== jour(m.created_at);
            return (
              <div key={m.id} className="flex flex-col">
                {nouveauJour && <div className="py-2 text-center text-[11px] font-semibold text-gris first-letter:uppercase">{jour(m.created_at)}</div>}
                <div className={`flex max-w-[80%] flex-col gap-0.5 ${aMoi ? "items-end self-end" : "items-start self-start"}`}>
                  <div
                    className={`whitespace-pre-wrap break-words rounded-[18px] px-3.5 py-2.5 text-[15px] leading-snug ${
                      aMoi ? "rounded-br-md bg-vert text-white" : "rounded-bl-md border border-[#e1e5e2] bg-white text-encre"
                    } ${m.enEchec ? "opacity-60" : ""}`}
                  >
                    {m.texte}
                  </div>
                  <span className={`px-1 text-[10px] ${m.enEchec ? "font-semibold text-rouge" : "text-gris"}`}>
                    {m.enEchec ? "Non envoyé" : m.id.startsWith("tmp-") ? "Envoi…" : heure(m.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={fin} />
        </div>
      </div>

      <form onSubmit={envoyer} className="border-t border-[#e1e5e2] bg-white">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-3 py-2.5 pb-[max(10px,env(safe-area-inset-bottom))]">
          <label className="flex h-12 flex-1 items-center rounded-full bg-[#f2f4f2] px-4">
            <span className="sr-only">Message</span>
            <input
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              maxLength={2000}
              placeholder="Écris ton message…"
              className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
            />
          </label>
          <button
            type="submit"
            aria-label="Envoyer"
            disabled={!texte.trim()}
            className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-vert text-white disabled:opacity-40"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 12l16-8-6 16-3-6z" />
              <path d="M11 14l9-10" />
            </svg>
          </button>
        </div>
      </form>
    </>
  );
}
