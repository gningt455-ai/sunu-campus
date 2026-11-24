-- =====================================================================
--  SUNU CAMPUS — Migration 004 : nouveaux lieux du campus
--  À exécuter une seule fois dans Supabase : SQL Editor > New query > Run
--  (Les prochains lieux s'ajoutent depuis l'espace admin > Lieux du campus)
-- =====================================================================

insert into public.lieux (nom, nom_court, type, description, geom) values
  ('Couloir de la mort', null, 'autre', 'Lieu emblématique du campus social.', extensions.st_setsrid(extensions.st_makepoint(-17.4636, 14.6920), 4326)),
  ('Place Omar Pène',    null, 'autre', 'Place du campus social.',             extensions.st_setsrid(extensions.st_makepoint(-17.4636, 14.6920), 4326));
