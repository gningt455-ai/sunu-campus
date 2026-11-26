-- =====================================================================
--  SUNU CAMPUS — Migration 007 : les vrais lieux du campus
--  À exécuter une seule fois dans Supabase : SQL Editor > New query > Run
--  Les lieux déjà présents (même nom) ne sont pas ajoutés deux fois.
-- =====================================================================

-- 1. Les facultés avec les noms que les étudiants utilisent
update public.lieux set nom = 'Fac de Droit (FSJP)'   where nom_court = 'FSJP';
update public.lieux set nom = 'Fac des Lettres (FLSH)' where nom_court = 'FLSH';
update public.lieux set nom = 'Fac des Sciences (FST)' where nom_court = 'FST';
update public.lieux set nom = 'FASEG (Fac d''économie)' where nom_court = 'FASEG';

-- 2. Les lieux à ajouter (le point GPS est celui de l'UCAD, il ne sert plus pour l'instant)
insert into public.lieux (nom, nom_court, type, description, geom)
select v.nom, v.nom_court, v.type::public.type_lieu, v.description,
       extensions.st_setsrid(extensions.st_makepoint(-17.4636, 14.6920), 4326)
from (values
  ('Fac de Médecine (FMPO)', 'FMPO', 'faculte', 'Médecine, pharmacie et odontologie.'),
  ('Fac de Droit (FSJP)',    'FSJP', 'faculte', 'Droit public, droit privé, science politique.'),
  ('Fac des Lettres (FLSH)', 'FLSH', 'faculte', 'Lettres, histoire, géographie, philosophie…'),
  ('Fac des Sciences (FST)', 'FST',  'faculte', 'Maths, physique, chimie, biologie, géologie.'),
  ('FASEG (Fac d''économie)', 'FASEG', 'faculte', 'Économie, gestion, finance.'),
  ('Pavillon A', 'Pav. A', 'pavillon', 'Résidence du campus social.'),
  ('Pavillon B', 'Pav. B', 'pavillon', 'Résidence du campus social.'),
  ('Pavillon C', 'Pav. C', 'pavillon', 'Résidence du campus social.'),
  ('Pavillon D', 'Pav. D', 'pavillon', 'Résidence du campus social.'),
  ('Pavillon F', 'Pav. F', 'pavillon', 'Résidence du campus social.'),
  ('Pavillon G', 'Pav. G', 'pavillon', 'Résidence du campus social.'),
  ('Pavillon H', 'Pav. H', 'pavillon', 'Résidence du campus social.'),
  ('Pavillon I', 'Pav. I', 'pavillon', 'Résidence du campus social.'),
  ('Pavillon J', 'Pav. J', 'pavillon', 'Résidence du campus social.'),
  ('Pavillon K', 'Pav. K', 'pavillon', 'Résidence du campus social.'),
  ('Pavillon L', 'Pav. L', 'pavillon', 'Résidence du campus social.'),
  ('Pavillon M', 'Pav. M', 'pavillon', 'Résidence du campus social.'),
  ('Pavillon O', 'Pav. O', 'pavillon', 'Résidence du campus social.'),
  ('Pavillon P', 'Pav. P', 'pavillon', 'Résidence du campus social.'),
  ('Pavillon Q', 'Pav. Q', 'pavillon', 'Résidence du campus social.'),
  ('Pavillon AMSA', 'AMSA', 'pavillon', 'Résidence du campus social.'),
  ('Pavillon Claudel', 'Claudel', 'pavillon', 'Résidence du campus social.')
) as v(nom, nom_court, type, description)
where not exists (select 1 from public.lieux l where lower(l.nom) = lower(v.nom));
