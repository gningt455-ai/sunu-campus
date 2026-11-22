-- =====================================================================
--  SUNU CAMPUS — Migration 002 : « Découvrir le campus » (histoires)
--  À exécuter une seule fois dans Supabase : SQL Editor > New query > Run
-- =====================================================================

create table public.histoires (
  id          uuid primary key default gen_random_uuid(),
  auteur_id   uuid references public.profiles (id) on delete set null,
  titre       text not null check (char_length(titre) between 3 and 120),
  resume      text check (char_length(resume) <= 300),
  contenu     text not null check (char_length(contenu) between 10 and 20000),
  couverture  text not null,                                  -- chemin dans le bucket « photos »
  photos      text[] not null default '{}' check (cardinality(photos) <= 12),
  publie      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index histoires_liste_idx on public.histoires (publie, created_at desc);

create trigger histoires_updated_at
  before update on public.histoires
  for each row execute function public.maj_updated_at();

-- Sécurité : tous les étudiants connectés lisent les histoires publiées ;
-- seul l'administrateur écrit, publie et voit les brouillons.
alter table public.histoires enable row level security;
revoke all on public.histoires from anon;
grant select, insert, update, delete on public.histoires to authenticated;

create policy "histoires publiees lisibles" on public.histoires
  for select to authenticated using (publie or public.est_admin());

create policy "histoires gerees par admin" on public.histoires
  for all to authenticated using (public.est_admin()) with check (public.est_admin());
