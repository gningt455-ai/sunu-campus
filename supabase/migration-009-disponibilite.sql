-- =====================================================================
--  SUNU CAMPUS — Migration 009 : disponibilité des annonces d'alimentation
--  À exécuter une seule fois dans Supabase : SQL Editor > New query > Run
-- =====================================================================

alter table public.annonces
  add column if not exists disponibilite text
  check (disponibilite in ('aujourdhui', 'tous_les_jours'));

comment on column public.annonces.disponibilite is
  'Alimentation seulement : aujourdhui (offre du jour, retirée des listes après 24 h) ou tous_les_jours';
