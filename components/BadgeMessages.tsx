"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Pastille rouge : nombre de messages reçus non lus, mise à jour en temps réel
export default function BadgeMessages({ initial, moi }: { initial: number; moi: string }) {
  const supabase = useMemo(() => createClient(), []);
  const idCanal = useId();
  const [nombre, setNombre] = useState(initial);

  useEffect(() => {
    async function recompter() {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("lu", false)
        .neq("expediteur_id", moi);
      setNombre(count ?? 0);
    }

    // Nouveau message ou message marqué comme lu : on recompte
    const canal = supabase
      .channel(`badge-${idCanal}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => recompter())
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [supabase, moi, idCanal]);

  if (nombre <= 0) return null;
  return (
    <span
      aria-label={`${nombre} message${nombre > 1 ? "s" : ""} non lu${nombre > 1 ? "s" : ""}`}
      className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rouge px-1.5 text-[11px] font-bold leading-none text-white"
    >
      {nombre > 99 ? "99+" : nombre}
    </span>
  );
}
