-- =====================================================================
--  SUNU CAMPUS — Migration 003 : Objets perdus et trouvés
--  (remplace le module Logements)
--  À exécuter une seule fois dans Supabase : SQL Editor > New query > Run
-- =====================================================================

create type public.sens_objet      as enum ('trouve', 'perdu');
create type public.categorie_objet as enum ('carte_etudiant', 'piece_identite', 'telephone', 'cles', 'sac', 'autre');
create type public.statut_objet    as enum ('en_cours', 'rendu', 'masque');

create table public.objets (
  id              uuid primary key default gen_random_uuid(),
  auteur_id       uuid not null references public.profiles (id) on delete cascade,
  sens            public.sens_objet not null,
  categorie       public.categorie_objet not null,
  titre           text not null check (char_length(titre) between 3 and 100),
  nom_sur_carte   text check (char_length(nom_sur_carte) <= 80),     -- nom écrit sur la carte / la pièce
  description     text check (char_length(description) <= 1000),
  lieu_id         uuid references public.lieux (id) on delete set null,
  lieu_texte      text check (char_length(lieu_texte) <= 100),
  date_evenement  date,
  photo           text,                                               -- jamais pour une carte ou une pièce d'identité
  statut          public.statut_objet not null default 'en_cours',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (categorie not in ('carte_etudiant', 'piece_identite') or photo is null),
  check (categorie not in ('carte_etudiant', 'piece_identite') or nom_sur_carte is not null)
);

create index objets_liste_idx on public.objets (statut, sens, categorie, created_at desc);
create index objets_nom_idx   on public.objets (lower(nom_sur_carte));

create trigger objets_updated_at   before update on public.objets for each row execute function public.maj_updated_at();
create trigger objets_proteger     before update on public.objets for each row execute function public.proteger_contenu_masque();
create trigger objets_filtre       before insert or update of titre, description on public.objets for each row execute function public.filtrer_mots_interdits();

-- Sécurité : visibles par tous les étudiants connectés (même en attente : celui qui a perdu
-- sa carte doit pouvoir la chercher) ; publication par les comptes vérifiés.
alter table public.objets enable row level security;
revoke all on public.objets from anon;
grant select, insert, update, delete on public.objets to authenticated;

create policy "objets lisibles" on public.objets
  for select to authenticated
  using (statut <> 'masque' or auteur_id = auth.uid() or public.est_admin());
create policy "declarer un objet" on public.objets
  for insert to authenticated
  with check (auteur_id = auth.uid() and public.est_verifie() and statut = 'en_cours');
create policy "modifier mon objet" on public.objets
  for update to authenticated
  using ((auteur_id = auth.uid() and public.est_verifie()) or public.est_admin())
  with check (auteur_id = auth.uid() or public.est_admin());
create policy "supprimer mon objet" on public.objets
  for delete to authenticated
  using (auteur_id = auth.uid() or public.est_admin());

-- Conversations liées à un objet
alter table public.conversations add column objet_id uuid references public.objets (id) on delete set null;
create unique index conversations_unique_objet on public.conversations (objet_id, demandeur_id) where objet_id is not null;

create or replace function public.ouvrir_conversation_objet(p_objet_id uuid)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_auteur uuid;
  v_id uuid;
begin
  if not public.est_verifie() then
    raise exception 'Ton compte doit être vérifié pour envoyer un message.';
  end if;
  select auteur_id into v_auteur from public.objets where id = p_objet_id and statut <> 'masque';
  if v_auteur is null then
    raise exception 'Objet introuvable.';
  end if;
  if v_auteur = auth.uid() then
    raise exception 'Tu ne peux pas t''envoyer un message à toi-même.';
  end if;
  select id into v_id from public.conversations where objet_id = p_objet_id and demandeur_id = auth.uid();
  if v_id is null then
    insert into public.conversations (objet_id, demandeur_id, proprietaire_id)
    values (p_objet_id, auth.uid(), v_auteur)
    returning id into v_id;
  end if;
  return v_id;
end;
$$;

revoke execute on function public.ouvrir_conversation_objet(uuid) from anon, public;
grant execute on function public.ouvrir_conversation_objet(uuid) to authenticated;

-- Signalements : on ajoute le type « objet »
alter type public.type_contenu add value if not exists 'objet';

-- Masquage automatique (3 signalements) et traitement admin : prise en charge des objets
create or replace function public.masquage_automatique()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  nb integer;
begin
  select count(*) into nb from public.signalements
  where type_contenu = new.type_contenu and contenu_id = new.contenu_id and statut = 'en_attente';

  if nb >= 3 then
    perform set_config('sunu.moderation_auto', 'on', true);
    case new.type_contenu::text
      when 'annonce'     then update public.annonces     set statut = 'masquee' where id = new.contenu_id and statut = 'en_ligne';
      when 'logement'    then update public.logements    set statut = 'masque'  where id = new.contenu_id and statut = 'en_ligne';
      when 'objet'       then update public.objets       set statut = 'masque'  where id = new.contenu_id and statut = 'en_cours';
      when 'publication' then update public.publications set statut = 'masquee' where id = new.contenu_id;
      when 'commentaire' then update public.commentaires set statut = 'masquee' where id = new.contenu_id;
      else null;
    end case;
    perform set_config('sunu.moderation_auto', 'off', true);
  end if;
  return new;
end;
$$;

create or replace function public.traiter_signalement(p_signalement_id uuid, p_supprimer boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  s public.signalements;
begin
  if not public.est_admin() then
    raise exception 'Réservé aux administrateurs.';
  end if;

  select * into s from public.signalements where id = p_signalement_id;
  if not found then
    raise exception 'Signalement introuvable.';
  end if;

  perform set_config('sunu.moderation_auto', 'on', true);
  if p_supprimer then
    case s.type_contenu::text
      when 'annonce'     then update public.annonces     set statut = 'masquee' where id = s.contenu_id;
      when 'logement'    then update public.logements    set statut = 'masque'  where id = s.contenu_id;
      when 'objet'       then update public.objets       set statut = 'masque'  where id = s.contenu_id;
      when 'publication' then update public.publications set statut = 'masquee' where id = s.contenu_id;
      when 'commentaire' then update public.commentaires set statut = 'masquee' where id = s.contenu_id;
      when 'message'     then delete from public.messages where id = s.contenu_id;
      else null;
    end case;
  else
    case s.type_contenu::text
      when 'annonce'     then update public.annonces     set statut = 'en_ligne' where id = s.contenu_id and statut = 'masquee';
      when 'logement'    then update public.logements    set statut = 'en_ligne' where id = s.contenu_id and statut = 'masque';
      when 'objet'       then update public.objets       set statut = 'en_cours' where id = s.contenu_id and statut = 'masque';
      when 'publication' then update public.publications set statut = 'visible'  where id = s.contenu_id;
      when 'commentaire' then update public.commentaires set statut = 'visible'  where id = s.contenu_id;
      else null;
    end case;
  end if;
  perform set_config('sunu.moderation_auto', 'off', true);

  update public.signalements
  set statut     = case when p_supprimer then 'traite'::public.statut_signalement else 'ignore'::public.statut_signalement end,
      traite_par = auth.uid(),
      traite_le  = now()
  where type_contenu = s.type_contenu and contenu_id = s.contenu_id and statut = 'en_attente';
end;
$$;
