-- =====================================================================
--  SUNU CAMPUS — Migration 005 : messages anonymes à 2 catégories
--  (Question et Coup de gueule)
--  À exécuter une seule fois dans Supabase : SQL Editor > New query > Run
-- =====================================================================

-- Les messages déjà publiés en « Bon plan » ou « Confession » passent en « Question »
update public.publications
set categorie = 'question'
where categorie in ('bon_plan', 'confession');

-- Désormais, seules ces deux catégories sont acceptées
alter table public.publications
  add constraint publications_deux_categories check (categorie in ('question', 'coup_de_gueule'));
