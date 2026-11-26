-- =====================================================================
-- Sunu Campus · Migration 006
-- 1. Deux nouvelles catégories d'annonces : Logiciels et jeux, Alimentation
-- 2. Les annonces vendues restent visibles (avec le bandeau VENDU)
-- À exécuter une seule fois dans Supabase → SQL Editor (projet sunu-campus).
-- =====================================================================

-- 1. Catégories (l'ordre fixe leur place dans les listes ; « Autres » reste en dernier)
insert into public.categories (slug, nom, icone, ordre) values
  ('logiciels',    'Logiciels et jeux', 'gamepad', 4),
  ('alimentation', 'Alimentation',      'food',    6)
on conflict (slug) do nothing;

update public.categories set ordre = 5 where slug = 'electro';
update public.categories set ordre = 7 where slug = 'autres';

-- 2. Les annonces vendues sont lisibles par tous les connectés
drop policy if exists "annonces lisibles" on public.annonces;
create policy "annonces lisibles" on public.annonces
  for select to authenticated
  using (statut in ('en_ligne', 'vendue') or auteur_id = auth.uid() or public.est_admin());
