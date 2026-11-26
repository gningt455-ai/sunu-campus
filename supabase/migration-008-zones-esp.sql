-- =====================================================================
--  SUNU CAMPUS — Migration 008 : Zones A, B, C et nom « ESP »
--  À exécuter une seule fois dans Supabase : SQL Editor > New query > Run
-- =====================================================================

update public.lieux set nom = 'ESP' where nom_court = 'ESP' or nom = 'École supérieure polytechnique';

insert into public.lieux (nom, nom_court, type, description, geom)
select v.nom, null, 'autre'::public.type_lieu, 'Lieu de rencontre du campus social.',
       extensions.st_setsrid(extensions.st_makepoint(-17.4636, 14.6920), 4326)
from (values ('Zone A'), ('Zone B'), ('Zone C')) as v(nom)
where not exists (select 1 from public.lieux l where lower(l.nom) = lower(v.nom));
