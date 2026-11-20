-- =====================================================================
--  SUNU CAMPUS — Schéma de la base de données (V1)
--  À exécuter en une seule fois dans Supabase : SQL Editor > New query
--  Contenu :
--    0. Extensions
--    1. Types (listes de valeurs)
--    2. Tables
--    3. Fonctions utilitaires (est_admin, est_verifie…)
--    4. Déclencheurs (triggers)
--    5. Fonctions métier (valider une carte, ouvrir une conversation…)
--    6. Vues du mur anonyme (l'auteur reste caché)
--    7. Sécurité : Row Level Security (RLS) et droits
--    8. Stockage des fichiers (cartes, photos, avatars)
--    9. Temps réel (messagerie)
--   10. Données de départ (catégories, lieux du campus)
-- =====================================================================


-- =====================================================================
-- 0. EXTENSIONS
-- =====================================================================
create extension if not exists postgis with schema extensions;


-- =====================================================================
-- 1. TYPES
-- =====================================================================
create type public.statut_compte     as enum ('en_attente', 'verifie', 'refuse', 'bloque');
create type public.role_utilisateur  as enum ('etudiant', 'admin');
create type public.etat_objet        as enum ('neuf', 'occasion');
create type public.statut_annonce    as enum ('en_ligne', 'vendue', 'masquee');
create type public.type_logement     as enum ('chambre', 'colocation', 'studio');
create type public.statut_logement   as enum ('en_ligne', 'loue', 'masque');
create type public.type_lieu         as enum ('faculte', 'service', 'resto', 'pavillon', 'autre');
create type public.categorie_mur     as enum ('question', 'bon_plan', 'confession', 'coup_de_gueule');
create type public.statut_publication as enum ('visible', 'masquee');
create type public.type_contenu      as enum ('annonce', 'logement', 'publication', 'commentaire', 'message', 'utilisateur');
create type public.statut_signalement as enum ('en_attente', 'traite', 'ignore');


-- =====================================================================
-- 2. TABLES
-- =====================================================================

-- 2.1 Profils publics des étudiants (1 ligne par compte Supabase Auth)
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  prenom      text not null check (char_length(prenom) between 1 and 60),
  nom         text not null check (char_length(nom) between 1 and 60),
  faculte     text,
  niveau      text,
  avatar_url  text,
  statut      public.statut_compte    not null default 'en_attente',
  role        public.role_utilisateur not null default 'etudiant',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2.2 Vérification de la carte étudiant (données sensibles : propriétaire + admin seulement)
create table public.verifications (
  user_id           uuid primary key references public.profiles (id) on delete cascade,
  numero_carte      text not null check (char_length(numero_carte) between 4 and 40),
  photo_carte_path  text not null,          -- chemin dans le bucket privé « cartes »
  motif_refus       text,
  traite_par        uuid references public.profiles (id),
  traite_le         timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- 2.3 Catégories d'annonces
create table public.categories (
  id     smallserial primary key,
  slug   text unique not null,
  nom    text not null,
  icone  text,
  ordre  smallint not null default 0
);

-- 2.4 Lieux du campus (carte)
create table public.lieux (
  id           uuid primary key default gen_random_uuid(),
  nom          text not null,
  nom_court    text,
  type         public.type_lieu not null,
  description  text,
  photo_url    text,
  geom         extensions.geometry(Geometry, 4326) not null,   -- point ou polygone
  created_at   timestamptz not null default now()
);

-- 2.5 Annonces (achat-vente)
create table public.annonces (
  id            uuid primary key default gen_random_uuid(),
  auteur_id     uuid not null references public.profiles (id) on delete cascade,
  titre         text not null check (char_length(titre) between 3 and 100),
  description   text check (char_length(description) <= 2000),
  prix          integer not null check (prix >= 0),               -- en FCFA
  etat          public.etat_objet not null default 'occasion',
  statut        public.statut_annonce not null default 'en_ligne',
  categorie_id  smallint not null references public.categories (id),
  lieu_id       uuid references public.lieux (id) on delete set null,  -- lieu de rencontre
  photos        text[] not null default '{}' check (cardinality(photos) <= 3),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 2.6 Logements hors campus
create table public.logements (
  id             uuid primary key default gen_random_uuid(),
  auteur_id      uuid not null references public.profiles (id) on delete cascade,
  type           public.type_logement not null,
  titre          text not null check (char_length(titre) between 3 and 100),
  description    text check (char_length(description) <= 2000),
  loyer          integer not null check (loyer >= 0),              -- FCFA par mois
  quartier       text not null,
  disponible_le  date,
  position       extensions.geography(Point, 4326) not null,
  photos         text[] not null default '{}' check (cardinality(photos) <= 3),
  statut         public.statut_logement not null default 'en_ligne',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- 2.7 Favoris (une annonce OU un logement)
create table public.favoris (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  annonce_id   uuid references public.annonces (id) on delete cascade,
  logement_id  uuid references public.logements (id) on delete cascade,
  created_at   timestamptz not null default now(),
  check (num_nonnulls(annonce_id, logement_id) = 1),
  unique (user_id, annonce_id),
  unique (user_id, logement_id)
);

-- 2.8 Conversations (entre l'étudiant intéressé et l'auteur de l'annonce / du logement)
create table public.conversations (
  id             uuid primary key default gen_random_uuid(),
  annonce_id     uuid references public.annonces (id) on delete set null,
  logement_id    uuid references public.logements (id) on delete set null,
  demandeur_id   uuid not null references public.profiles (id) on delete cascade,
  proprietaire_id uuid not null references public.profiles (id) on delete cascade,
  dernier_message_le timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  check (demandeur_id <> proprietaire_id),
  check (num_nonnulls(annonce_id, logement_id) <= 1)
);
create unique index conversations_unique_annonce  on public.conversations (annonce_id, demandeur_id)  where annonce_id is not null;
create unique index conversations_unique_logement on public.conversations (logement_id, demandeur_id) where logement_id is not null;

-- 2.9 Messages
create table public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations (id) on delete cascade,
  expediteur_id    uuid not null references public.profiles (id) on delete cascade,
  texte            text not null check (char_length(texte) between 1 and 2000),
  lu               boolean not null default false,
  created_at       timestamptz not null default now()
);

-- 2.10 Mur anonyme : publications
create table public.publications (
  id          uuid primary key default gen_random_uuid(),
  auteur_id   uuid not null references public.profiles (id) on delete cascade,  -- jamais exposé au public
  categorie   public.categorie_mur not null,
  texte       text not null check (char_length(texte) between 3 and 1000),
  statut      public.statut_publication not null default 'visible',
  created_at  timestamptz not null default now()
);

-- 2.11 Mur anonyme : réactions (j'aime)
create table public.reactions (
  publication_id  uuid not null references public.publications (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (publication_id, user_id)
);

-- 2.12 Mur anonyme : commentaires (anonymes eux aussi)
create table public.commentaires (
  id              uuid primary key default gen_random_uuid(),
  publication_id  uuid not null references public.publications (id) on delete cascade,
  auteur_id       uuid not null references public.profiles (id) on delete cascade,
  texte           text not null check (char_length(texte) between 1 and 500),
  statut          public.statut_publication not null default 'visible',
  created_at      timestamptz not null default now()
);

-- 2.13 Signalements
create table public.signalements (
  id            uuid primary key default gen_random_uuid(),
  auteur_id     uuid not null references public.profiles (id) on delete cascade,
  type_contenu  public.type_contenu not null,
  contenu_id    uuid not null,
  motif         text not null check (char_length(motif) between 3 and 200),
  details       text check (char_length(details) <= 1000),
  statut        public.statut_signalement not null default 'en_attente',
  traite_par    uuid references public.profiles (id),
  traite_le     timestamptz,
  created_at    timestamptz not null default now(),
  unique (auteur_id, type_contenu, contenu_id)       -- un étudiant ne signale qu'une fois le même contenu
);

-- 2.14 Mots interdits (filtre de modération)
create table public.mots_interdits (
  mot text primary key
);

-- Index utiles
create index annonces_liste_idx      on public.annonces (statut, categorie_id, created_at desc);
create index annonces_auteur_idx     on public.annonces (auteur_id);
create index logements_liste_idx     on public.logements (statut, type, loyer);
create index logements_position_idx  on public.logements using gist (position);
create index lieux_geom_idx          on public.lieux using gist (geom);
create index messages_conv_idx       on public.messages (conversation_id, created_at);
create index publications_liste_idx  on public.publications (statut, categorie, created_at desc);
create index commentaires_pub_idx    on public.commentaires (publication_id, created_at);
create index signalements_file_idx   on public.signalements (statut, type_contenu, contenu_id);


-- =====================================================================
-- 3. FONCTIONS UTILITAIRES
-- =====================================================================

-- Point de référence de l'UCAD (coordonnées approximatives : à ajuster)
create or replace function public.ucad_point()
returns extensions.geography
language sql immutable
set search_path = ''
as $$
  select extensions.st_setsrid(extensions.st_makepoint(-17.4636, 14.6920), 4326)::extensions.geography;
$$;

create or replace function public.est_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and statut = 'verifie'
  );
$$;

create or replace function public.est_verifie()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and statut = 'verifie'
  );
$$;

-- Vrai si le texte contient un mot interdit
create or replace function public.contient_mot_interdit(t text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.mots_interdits m
    where t ~* ('\m' || m.mot || '\M')   -- mot entier, sans tenir compte des majuscules
  );
$$;


-- =====================================================================
-- 4. DÉCLENCHEURS (TRIGGERS)
-- =====================================================================

-- 4.1 Mise à jour automatique de updated_at
create or replace function public.maj_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_updated_at      before update on public.profiles      for each row execute function public.maj_updated_at();
create trigger verifications_updated_at before update on public.verifications for each row execute function public.maj_updated_at();
create trigger annonces_updated_at      before update on public.annonces      for each row execute function public.maj_updated_at();
create trigger logements_updated_at     before update on public.logements     for each row execute function public.maj_updated_at();

-- 4.2 Création automatique du profil à l'inscription
--     Le front-end envoie prenom, nom, faculte, niveau dans options.data de signUp().
create or replace function public.creer_profil()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, prenom, nom, faculte, niveau)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'prenom', ''), 'Étudiant'),
    coalesce(nullif(new.raw_user_meta_data ->> 'nom', ''), '—'),
    new.raw_user_meta_data ->> 'faculte',
    new.raw_user_meta_data ->> 'niveau'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.creer_profil();

-- 4.3 Une nouvelle demande de vérification remet le compte « en attente »
create or replace function public.demande_verification()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.est_admin() then
    new.motif_refus := null;
    new.traite_par  := null;
    new.traite_le   := null;
    update public.profiles set statut = 'en_attente'
    where id = new.user_id and statut = 'refuse';
  end if;
  return new;
end;
$$;

create trigger verifications_demande
  before insert or update on public.verifications
  for each row execute function public.demande_verification();

-- 4.4 Un contenu masqué par la modération ne peut être remis en ligne que par un admin.
--     Exception : la modération automatique (4.6) et le traitement des signalements (5.3),
--     qui activent l'indicateur de session « sunu.moderation_auto ».
create or replace function public.proteger_contenu_masque()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_setting('sunu.moderation_auto', true) = 'on' or public.est_admin() then
    return new;
  end if;
  if old.statut::text in ('masquee', 'masque') and new.statut is distinct from old.statut then
    raise exception 'Ce contenu a été masqué par la modération.';
  end if;
  if new.statut::text in ('masquee', 'masque') and new.statut is distinct from old.statut then
    raise exception 'Seul un administrateur peut masquer un contenu.';
  end if;
  return new;
end;
$$;

create trigger annonces_proteger  before update on public.annonces  for each row execute function public.proteger_contenu_masque();
create trigger logements_proteger before update on public.logements for each row execute function public.proteger_contenu_masque();

-- 4.5 Filtre de mots interdits (annonces, logements, mur, commentaires)
create or replace function public.filtrer_mots_interdits()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  contenu text;
begin
  contenu := coalesce(to_jsonb(new) ->> 'titre', '') || ' '
          || coalesce(to_jsonb(new) ->> 'description', '') || ' '
          || coalesce(to_jsonb(new) ->> 'texte', '');
  if public.contient_mot_interdit(contenu) then
    raise exception 'Ton texte contient un mot interdit par la charte.';
  end if;
  return new;
end;
$$;

create trigger annonces_filtre     before insert or update of titre, description on public.annonces     for each row execute function public.filtrer_mots_interdits();
create trigger logements_filtre    before insert or update of titre, description on public.logements    for each row execute function public.filtrer_mots_interdits();
create trigger publications_filtre before insert or update of texte              on public.publications for each row execute function public.filtrer_mots_interdits();
create trigger commentaires_filtre before insert or update of texte              on public.commentaires for each row execute function public.filtrer_mots_interdits();

-- 4.6 Masquage automatique après 3 signalements en attente
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
    case new.type_contenu
      when 'annonce'     then update public.annonces     set statut = 'masquee' where id = new.contenu_id and statut = 'en_ligne';
      when 'logement'    then update public.logements    set statut = 'masque'  where id = new.contenu_id and statut = 'en_ligne';
      when 'publication' then update public.publications set statut = 'masquee' where id = new.contenu_id;
      when 'commentaire' then update public.commentaires set statut = 'masquee' where id = new.contenu_id;
      else null;
    end case;
    perform set_config('sunu.moderation_auto', 'off', true);
  end if;
  return new;
end;
$$;

create trigger signalements_masquage
  after insert on public.signalements
  for each row execute function public.masquage_automatique();

-- 4.7 Message envoyé : met à jour la date de la conversation
create or replace function public.maj_conversation()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  update public.conversations set dernier_message_le = new.created_at where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_maj_conversation
  after insert on public.messages
  for each row execute function public.maj_conversation();


-- =====================================================================
-- 5. FONCTIONS MÉTIER (appelées depuis le site avec supabase.rpc)
-- =====================================================================

-- 5.1 Admin : valider ou refuser une carte étudiant
create or replace function public.traiter_verification(p_user_id uuid, p_accepte boolean, p_motif text default null)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.est_admin() then
    raise exception 'Réservé aux administrateurs.';
  end if;

  update public.verifications
  set motif_refus = case when p_accepte then null else p_motif end,
      traite_par  = auth.uid(),
      traite_le   = now()
  where user_id = p_user_id;

  update public.profiles
  set statut = case when p_accepte then 'verifie'::public.statut_compte else 'refuse'::public.statut_compte end
  where id = p_user_id;
end;
$$;

-- 5.2 Admin : bloquer ou débloquer un compte
create or replace function public.bloquer_compte(p_user_id uuid, p_bloquer boolean default true)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.est_admin() then
    raise exception 'Réservé aux administrateurs.';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Tu ne peux pas bloquer ton propre compte.';
  end if;
  update public.profiles
  set statut = case when p_bloquer then 'bloque'::public.statut_compte else 'verifie'::public.statut_compte end
  where id = p_user_id;
end;
$$;

-- 5.3 Admin : traiter un signalement (supprimer le contenu ou ignorer)
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

  if p_supprimer then
    case s.type_contenu
      when 'annonce'     then update public.annonces     set statut = 'masquee' where id = s.contenu_id;
      when 'logement'    then update public.logements    set statut = 'masque'  where id = s.contenu_id;
      when 'publication' then update public.publications set statut = 'masquee' where id = s.contenu_id;
      when 'commentaire' then update public.commentaires set statut = 'masquee' where id = s.contenu_id;
      when 'message'     then delete from public.messages where id = s.contenu_id;
      else null;
    end case;
  else
    -- Signalement ignoré : le contenu redevient visible s'il avait été masqué automatiquement
    perform set_config('sunu.moderation_auto', 'on', true);
    case s.type_contenu
      when 'annonce'     then update public.annonces     set statut = 'en_ligne' where id = s.contenu_id and statut = 'masquee';
      when 'logement'    then update public.logements    set statut = 'en_ligne' where id = s.contenu_id and statut = 'masque';
      when 'publication' then update public.publications set statut = 'visible'  where id = s.contenu_id;
      when 'commentaire' then update public.commentaires set statut = 'visible'  where id = s.contenu_id;
      else null;
    end case;
    perform set_config('sunu.moderation_auto', 'off', true);
  end if;

  -- Tous les signalements sur ce même contenu sont clos
  update public.signalements
  set statut     = case when p_supprimer then 'traite'::public.statut_signalement else 'ignore'::public.statut_signalement end,
      traite_par = auth.uid(),
      traite_le  = now()
  where type_contenu = s.type_contenu and contenu_id = s.contenu_id and statut = 'en_attente';
end;
$$;

-- 5.4 Admin : voir l'auteur réel d'une publication anonyme (en cas d'abus)
create or replace function public.auteur_publication(p_publication_id uuid)
returns table (id uuid, prenom text, nom text, faculte text)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not public.est_admin() then
    raise exception 'Réservé aux administrateurs.';
  end if;
  return query
    select p.id, p.prenom, p.nom, p.faculte
    from public.publications pub
    join public.profiles p on p.id = pub.auteur_id
    where pub.id = p_publication_id;
end;
$$;

-- 5.5 Ouvrir (ou retrouver) une conversation à partir d'une annonce ou d'un logement
create or replace function public.ouvrir_conversation(p_annonce_id uuid default null, p_logement_id uuid default null)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_proprietaire uuid;
  v_id uuid;
begin
  if not public.est_verifie() then
    raise exception 'Ton compte doit être vérifié pour envoyer un message.';
  end if;
  if num_nonnulls(p_annonce_id, p_logement_id) <> 1 then
    raise exception 'Indique une annonce OU un logement.';
  end if;

  if p_annonce_id is not null then
    select auteur_id into v_proprietaire from public.annonces where id = p_annonce_id and statut <> 'masquee';
    select id into v_id from public.conversations where annonce_id = p_annonce_id and demandeur_id = auth.uid();
  else
    select auteur_id into v_proprietaire from public.logements where id = p_logement_id and statut <> 'masque';
    select id into v_id from public.conversations where logement_id = p_logement_id and demandeur_id = auth.uid();
  end if;

  if v_proprietaire is null then
    raise exception 'Annonce ou logement introuvable.';
  end if;
  if v_proprietaire = auth.uid() then
    raise exception 'Tu ne peux pas t''envoyer un message à toi-même.';
  end if;

  if v_id is null then
    insert into public.conversations (annonce_id, logement_id, demandeur_id, proprietaire_id)
    values (p_annonce_id, p_logement_id, auth.uid(), v_proprietaire)
    returning id into v_id;
  end if;
  return v_id;
end;
$$;

-- 5.6 Rechercher des logements, triés par distance de l'UCAD
create or replace function public.rechercher_logements(
  p_loyer_max integer default null,
  p_type public.type_logement default null,
  p_rayon_m integer default null
)
returns table (
  id uuid, type public.type_logement, titre text, loyer integer, quartier text,
  photos text[], disponible_le date, distance_m integer, lat double precision, lng double precision
)
language sql stable
set search_path = ''
as $$
  select l.id, l.type, l.titre, l.loyer, l.quartier, l.photos, l.disponible_le,
         round(extensions.st_distance(l.position, public.ucad_point()))::integer as distance_m,
         extensions.st_y(l.position::extensions.geometry) as lat,
         extensions.st_x(l.position::extensions.geometry) as lng
  from public.logements l
  where l.statut = 'en_ligne'
    and (p_loyer_max is null or l.loyer <= p_loyer_max)
    and (p_type is null or l.type = p_type)
    and (p_rayon_m is null or extensions.st_dwithin(l.position, public.ucad_point(), p_rayon_m))
  order by distance_m;
$$;

-- 5.7 Lieux du campus au format GeoJSON (pour Leaflet)
create or replace function public.lieux_geojson()
returns jsonb
language sql stable
set search_path = ''
as $$
  select jsonb_build_object(
    'type', 'FeatureCollection',
    'features', coalesce(jsonb_agg(jsonb_build_object(
      'type', 'Feature',
      'geometry', extensions.st_asgeojson(l.geom)::jsonb,
      'properties', jsonb_build_object(
        'id', l.id, 'nom', l.nom, 'nom_court', l.nom_court, 'type', l.type,
        'description', l.description, 'photo_url', l.photo_url,
        'nb_annonces', (select count(*) from public.annonces a where a.lieu_id = l.id and a.statut = 'en_ligne')
      )
    )), '[]'::jsonb)
  )
  from public.lieux l;
$$;


-- =====================================================================
-- 6. VUES DU MUR ANONYME (aucune colonne auteur_id exposée)
--    Ces vues lisent les tables avec les droits de leur propriétaire :
--    c'est voulu, pour montrer les publications sans révéler l'auteur.
-- =====================================================================
create or replace view public.mur as
  select p.id,
         p.categorie,
         p.texte,
         p.created_at,
         (select count(*) from public.reactions r where r.publication_id = p.id)::integer as nb_reactions,
         (select count(*) from public.commentaires c where c.publication_id = p.id and c.statut = 'visible')::integer as nb_commentaires,
         exists (select 1 from public.reactions r where r.publication_id = p.id and r.user_id = auth.uid()) as j_aime,
         (p.auteur_id = auth.uid()) as est_a_moi
  from public.publications p
  where p.statut = 'visible'
    and public.est_verifie();

create or replace view public.mur_commentaires as
  select c.id,
         c.publication_id,
         c.texte,
         c.created_at,
         (c.auteur_id = auth.uid()) as est_a_moi
  from public.commentaires c
  join public.publications p on p.id = c.publication_id
  where c.statut = 'visible'
    and p.statut = 'visible'
    and public.est_verifie();


-- =====================================================================
-- 7. SÉCURITÉ : ROW LEVEL SECURITY ET DROITS
-- =====================================================================
alter table public.profiles       enable row level security;
alter table public.verifications  enable row level security;
alter table public.categories     enable row level security;
alter table public.lieux          enable row level security;
alter table public.annonces       enable row level security;
alter table public.logements      enable row level security;
alter table public.favoris        enable row level security;
alter table public.conversations  enable row level security;
alter table public.messages       enable row level security;
alter table public.publications   enable row level security;
alter table public.reactions      enable row level security;
alter table public.commentaires   enable row level security;
alter table public.signalements   enable row level security;
alter table public.mots_interdits enable row level security;

-- Droits de base : les étudiants connectés peuvent utiliser les tables (filtrées ensuite par RLS),
-- les visiteurs non connectés n'ont accès à rien.
-- (Ne dépend pas de l'option « Grant API access to new tables automatically ».)
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke execute on all functions in schema public from anon, public;
grant  execute on all functions in schema public to authenticated;

-- 7.1 Profils : lisibles par les étudiants connectés ; chacun ne modifie que ses infos de base.
--     statut et role ne changent QUE par les fonctions admin (5.1, 5.2).
create policy "profils lisibles" on public.profiles
  for select to authenticated using (true);
create policy "modifier mon profil" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant  update (prenom, nom, faculte, niveau, avatar_url) on public.profiles to authenticated;
revoke insert, delete on public.profiles from authenticated;

-- 7.2 Vérifications : l'étudiant envoie / renvoie sa demande ; seul l'admin voit toutes les demandes
create policy "voir ma demande ou admin" on public.verifications
  for select to authenticated using (user_id = auth.uid() or public.est_admin());
create policy "envoyer ma demande" on public.verifications
  for insert to authenticated with check (user_id = auth.uid());
create policy "renvoyer ma demande" on public.verifications
  for update to authenticated
  using (user_id = auth.uid() and not public.est_verifie())
  with check (user_id = auth.uid());
revoke update on public.verifications from authenticated;
grant  update (numero_carte, photo_carte_path) on public.verifications to authenticated;

-- 7.3 Catégories et lieux : lecture pour tous les connectés, écriture admin
create policy "categories lisibles" on public.categories for select to authenticated using (true);
create policy "categories admin"    on public.categories for all    to authenticated using (public.est_admin()) with check (public.est_admin());
create policy "lieux lisibles"      on public.lieux      for select to authenticated using (true);
create policy "lieux admin"         on public.lieux      for all    to authenticated using (public.est_admin()) with check (public.est_admin());

-- 7.4 Annonces : visibles par les connectés (même en attente), publiées par les vérifiés
create policy "annonces lisibles" on public.annonces
  for select to authenticated
  using (statut = 'en_ligne' or auteur_id = auth.uid() or public.est_admin());
create policy "publier une annonce" on public.annonces
  for insert to authenticated
  with check (auteur_id = auth.uid() and public.est_verifie() and statut = 'en_ligne');
create policy "modifier mon annonce" on public.annonces
  for update to authenticated
  using ((auteur_id = auth.uid() and public.est_verifie()) or public.est_admin())
  with check ((auteur_id = auth.uid()) or public.est_admin());
create policy "supprimer mon annonce" on public.annonces
  for delete to authenticated
  using (auteur_id = auth.uid() or public.est_admin());

-- 7.5 Logements : réservés aux comptes vérifiés
create policy "logements lisibles" on public.logements
  for select to authenticated
  using ((statut = 'en_ligne' and public.est_verifie()) or auteur_id = auth.uid() or public.est_admin());
create policy "publier un logement" on public.logements
  for insert to authenticated
  with check (auteur_id = auth.uid() and public.est_verifie() and statut = 'en_ligne');
create policy "modifier mon logement" on public.logements
  for update to authenticated
  using ((auteur_id = auth.uid() and public.est_verifie()) or public.est_admin())
  with check ((auteur_id = auth.uid()) or public.est_admin());
create policy "supprimer mon logement" on public.logements
  for delete to authenticated
  using (auteur_id = auth.uid() or public.est_admin());

-- 7.6 Favoris : chacun gère les siens
create policy "mes favoris" on public.favoris
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.est_verifie());

-- 7.7 Conversations : visibles par les deux participants ; création via ouvrir_conversation()
create policy "mes conversations" on public.conversations
  for select to authenticated
  using (auth.uid() in (demandeur_id, proprietaire_id));
revoke insert, update, delete on public.conversations from authenticated;

-- 7.8 Messages : lecture et envoi par les participants vérifiés ; seul « lu » est modifiable
create policy "lire mes messages" on public.messages
  for select to authenticated
  using (exists (select 1 from public.conversations c
                 where c.id = conversation_id and auth.uid() in (c.demandeur_id, c.proprietaire_id)));
create policy "envoyer un message" on public.messages
  for insert to authenticated
  with check (expediteur_id = auth.uid()
              and public.est_verifie()
              and exists (select 1 from public.conversations c
                          where c.id = conversation_id and auth.uid() in (c.demandeur_id, c.proprietaire_id)));
create policy "marquer comme lu" on public.messages
  for update to authenticated
  using (expediteur_id <> auth.uid()
         and exists (select 1 from public.conversations c
                     where c.id = conversation_id and auth.uid() in (c.demandeur_id, c.proprietaire_id)));
revoke update on public.messages from authenticated;
grant  update (lu) on public.messages to authenticated;

-- 7.9 Mur anonyme : la table brute n'est lisible que par l'auteur et l'admin.
--     Les autres passent par les vues « mur » et « mur_commentaires ».
create policy "mes publications ou admin" on public.publications
  for select to authenticated using (auteur_id = auth.uid() or public.est_admin());
create policy "publier sur le mur" on public.publications
  for insert to authenticated
  with check (auteur_id = auth.uid() and public.est_verifie() and statut = 'visible');
create policy "supprimer ma publication" on public.publications
  for delete to authenticated using (auteur_id = auth.uid() or public.est_admin());
create policy "moderer une publication" on public.publications
  for update to authenticated using (public.est_admin()) with check (public.est_admin());

create policy "reactions lisibles" on public.reactions
  for select to authenticated using (public.est_verifie());
create policy "reagir" on public.reactions
  for insert to authenticated with check (user_id = auth.uid() and public.est_verifie());
create policy "retirer ma reaction" on public.reactions
  for delete to authenticated using (user_id = auth.uid());

create policy "mes commentaires ou admin" on public.commentaires
  for select to authenticated using (auteur_id = auth.uid() or public.est_admin());
create policy "commenter" on public.commentaires
  for insert to authenticated
  with check (auteur_id = auth.uid() and public.est_verifie() and statut = 'visible');
create policy "supprimer mon commentaire" on public.commentaires
  for delete to authenticated using (auteur_id = auth.uid() or public.est_admin());
create policy "moderer un commentaire" on public.commentaires
  for update to authenticated using (public.est_admin()) with check (public.est_admin());

revoke all on public.mur, public.mur_commentaires from anon, public;
grant select on public.mur, public.mur_commentaires to authenticated;

-- 7.10 Signalements : tout étudiant vérifié peut signaler ; l'admin traite via traiter_signalement()
create policy "signaler" on public.signalements
  for insert to authenticated
  with check (auteur_id = auth.uid() and public.est_verifie() and statut = 'en_attente');
create policy "mes signalements ou admin" on public.signalements
  for select to authenticated using (auteur_id = auth.uid() or public.est_admin());

-- 7.11 Mots interdits : admin uniquement
create policy "mots interdits admin" on public.mots_interdits
  for all to authenticated using (public.est_admin()) with check (public.est_admin());


-- =====================================================================
-- 8. STOCKAGE DES FICHIERS
--    Chaque fichier est rangé dans un dossier au nom de l'utilisateur :
--    <bucket>/<id de l'utilisateur>/<nom du fichier>
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('cartes',  'cartes',  false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('photos',  'photos',  true,  5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', true,  2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Cartes étudiant : privé (propriétaire + admin)
create policy "cartes : envoyer la mienne" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'cartes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "cartes : remplacer la mienne" on storage.objects
  for update to authenticated
  using (bucket_id = 'cartes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "cartes : voir la mienne ou admin" on storage.objects
  for select to authenticated
  using (bucket_id = 'cartes' and ((storage.foldername(name))[1] = auth.uid()::text or public.est_admin()));
create policy "cartes : supprimer (admin)" on storage.objects
  for delete to authenticated
  using (bucket_id = 'cartes' and public.est_admin());

-- Photos d'annonces et de logements : publiques en lecture, envoi par les vérifiés
create policy "photos : envoyer" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text and public.est_verifie());
create policy "photos : supprimer les miennes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.est_admin()));

-- Avatars
create policy "avatars : envoyer le mien" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars : remplacer le mien" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars : supprimer le mien" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);


-- =====================================================================
-- 9. TEMPS RÉEL (nouveaux messages affichés sans recharger la page)
-- =====================================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;


-- =====================================================================
-- 10. DONNÉES DE DÉPART
-- =====================================================================
insert into public.categories (slug, nom, icone, ordre) values
  ('livres',  'Livres et cours', 'book',     1),
  ('habits',  'Habits',          'shirt',    2),
  ('info',    'Informatique',    'laptop',   3),
  ('electro', 'Électroménager',  'fan',      4),
  ('autres',  'Autres',          'package',  5);

-- Exemples : l'administrateur complète la liste depuis le tableau de bord
insert into public.mots_interdits (mot) values
  ('drogue'), ('cannabis');

-- Lieux du campus : positions APPROXIMATIVES pour démarrer.
-- À remplacer par tes relevés (points ou contours des bâtiments).
insert into public.lieux (nom, nom_court, type, description, geom) values
  ('Bibliothèque centrale',                         'BU',    'service',  'Salles de lecture et de révision.',            extensions.st_setsrid(extensions.st_makepoint(-17.4630, 14.6928), 4326)),
  ('Faculté des Lettres et Sciences humaines',      'FLSH',  'faculte',  'Lettres, histoire, géographie, philosophie…',  extensions.st_setsrid(extensions.st_makepoint(-17.4655, 14.6935), 4326)),
  ('Faculté des Sciences et Techniques',            'FST',   'faculte',  'Maths, physique, chimie, biologie, géologie.', extensions.st_setsrid(extensions.st_makepoint(-17.4610, 14.6940), 4326)),
  ('Faculté des Sciences juridiques et politiques', 'FSJP',  'faculte',  'Droit public, droit privé, science politique.', extensions.st_setsrid(extensions.st_makepoint(-17.4645, 14.6915), 4326)),
  ('Faculté des Sciences économiques et de gestion','FASEG', 'faculte',  'Économie, gestion, finance.',                  extensions.st_setsrid(extensions.st_makepoint(-17.4600, 14.6920), 4326)),
  ('École supérieure polytechnique',                'ESP',   'faculte',  'Écoles d''ingénieurs et DUT.',                 extensions.st_setsrid(extensions.st_makepoint(-17.4585, 14.6910), 4326)),
  ('Restaurant central',                            'Resto', 'resto',    'Repas étudiants.',                             extensions.st_setsrid(extensions.st_makepoint(-17.4640, 14.6895), 4326)),
  ('Pavillon A',                                    'Pav. A','pavillon', 'Résidence du campus social.',                  extensions.st_setsrid(extensions.st_makepoint(-17.4660, 14.6885), 4326));

-- =====================================================================
-- FIN DU SCRIPT
-- Étape suivante : créer ton compte depuis le site, puis te nommer admin :
--   update public.profiles set role = 'admin', statut = 'verifie'
--   where id = (select id from auth.users where phone = '221XXXXXXXXX');
-- =====================================================================
