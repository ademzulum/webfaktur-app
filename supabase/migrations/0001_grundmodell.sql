-- ============================================================================
-- 0001  Grundlegendes Datenmodell
--
-- Fünf Tabellen: betriebe, nutzer, anrufe, bewertungen, tokens.
-- Die Mandantentrennung steckt in der Datenbank (Row Level Security),
-- nicht in der Anwendung. Selbst bei einem Fehler im Next.js-Code kann
-- Postgres keine fremden Daten herausgeben.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. betriebe -- die Handwerksbetriebe, also die Kunden der Agentur
-- ---------------------------------------------------------------------------
create table if not exists public.betriebe (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null,
  telefon                 text,           -- Zielnummer für die Bewertungs-SMS
  google_ads_kundennummer text,           -- für die Rückmeldung der Conversions
  paket                   text not null default 'basis',
  aktiv                   boolean not null default true,

  -- Was die drei Auftragsgrößen für diesen Betrieb ungefähr wert sind.
  -- In Cent, damit keine Rundungsfehler entstehen (250,00 EUR = 25000).
  wert_klein_cent         bigint not null default 25000,
  wert_mittel_cent        bigint not null default 100000,
  wert_gross_cent         bigint not null default 300000,

  angelegt_am             timestamptz not null default now(),

  constraint betriebe_werte_aufsteigend check (
    wert_klein_cent > 0
    and wert_klein_cent < wert_mittel_cent
    and wert_mittel_cent < wert_gross_cent
  )
);

comment on table public.betriebe is
  'Handwerksbetriebe. Jeder Anruf und jede Bewertung gehört genau einem davon.';


-- ---------------------------------------------------------------------------
-- 2. nutzer -- verbindet ein Anmeldekonto mit einer Rolle und einem Betrieb
--
-- Die id ist bewusst dieselbe wie in auth.users. Supabase verwaltet dort
-- Passwörter und Sitzungen; hier steht nur, wer wozu berechtigt ist.
-- ---------------------------------------------------------------------------
create table if not exists public.nutzer (
  id          uuid primary key references auth.users(id) on delete cascade,
  betrieb_id  uuid references public.betriebe(id) on delete restrict,
  rolle       text not null check (rolle in ('admin', 'betrieb')),
  name        text,
  angelegt_am timestamptz not null default now(),

  -- Ein Betriebsnutzer ohne Betrieb wäre sinnlos und gefährlich.
  constraint nutzer_betrieb_pflicht check (
    rolle <> 'betrieb' or betrieb_id is not null
  )
);


-- ---------------------------------------------------------------------------
-- 3. anrufe -- was matelso nach jedem Gespräch meldet
-- ---------------------------------------------------------------------------
create table if not exists public.anrufe (
  id                uuid primary key default gen_random_uuid(),
  betrieb_id        uuid not null references public.betriebe(id) on delete cascade,

  -- Die Kennung von matelso. "unique" ist hier die eigentliche Absicherung:
  -- Schickt matelso denselben Webhook zweimal (Wiederholung nach Zeitüber-
  -- schreitung), weist die Datenbank den zweiten Eintrag von selbst ab.
  matelso_id        text not null unique,

  anrufer_nummer    text,                 -- personenbezogen, bleibt in der EU
  angerufene_nummer text,
  beginn            timestamptz not null,
  dauer_sekunden    integer check (dauer_sekunden is null or dauer_sekunden >= 0),

  -- Woher der Anruf kam, für die Auswertung nach Kampagne und Keyword
  kampagne          text,
  anzeigengruppe    text,
  keyword           text,
  gclid             text,                 -- Google-Klick-Kennung

  angelegt_am       timestamptz not null default now()
);


-- ---------------------------------------------------------------------------
-- 4. bewertungen -- das Ergebnis der zwei Taps
-- ---------------------------------------------------------------------------
create table if not exists public.bewertungen (
  id                    uuid primary key default gen_random_uuid(),

  -- "unique": pro Anruf genau eine Bewertung, doppelte sind ausgeschlossen.
  anruf_id              uuid not null unique
                          references public.anrufe(id) on delete cascade,
  betrieb_id            uuid not null
                          references public.betriebe(id) on delete cascade,

  ergebnis              text not null check (
                          ergebnis in ('kein_auftrag', 'klein', 'mittel', 'gross')
                        ),

  -- Der Betrag, der zum Zeitpunkt der Bewertung für diese Stufe galt.
  -- Bewusst mitgespeichert statt später nachgeschlagen: Ändert der Betrieb
  -- seine Wertstufen, bleiben bereits gemeldete Umsätze unverändert.
  wert_cent             bigint not null check (wert_cent >= 0),

  bewertet_am           timestamptz not null default now(),

  -- Nachweis der Übermittlung an Google
  an_google_gesendet_am timestamptz,
  google_fehler         text
);


-- ---------------------------------------------------------------------------
-- 5. tokens -- die Einmal-Links aus der SMS
--
-- Gespeichert wird nur der Hash, nie der Link selbst. Wer die Datenbank
-- liest, kann daraus keinen gültigen Link zurückrechnen.
-- ---------------------------------------------------------------------------
create table if not exists public.tokens (
  id          uuid primary key default gen_random_uuid(),
  anruf_id    uuid not null references public.anrufe(id) on delete cascade,
  betrieb_id  uuid not null references public.betriebe(id) on delete cascade,
  token_hash  text not null unique,
  gueltig_bis timestamptz not null,
  verwendet_am timestamptz,
  angelegt_am timestamptz not null default now()
);


-- ---------------------------------------------------------------------------
-- Indizes -- damit die Auswertungen später nicht langsam werden
-- ---------------------------------------------------------------------------
create index if not exists anrufe_betrieb_beginn_idx
  on public.anrufe (betrieb_id, beginn desc);
create index if not exists bewertungen_betrieb_idx
  on public.bewertungen (betrieb_id, bewertet_am desc);
create index if not exists bewertungen_offen_idx
  on public.bewertungen (an_google_gesendet_am) where an_google_gesendet_am is null;
create index if not exists tokens_anruf_idx on public.tokens (anruf_id);
create index if not exists nutzer_betrieb_idx on public.nutzer (betrieb_id);


-- ---------------------------------------------------------------------------
-- Hilfsfunktionen für die Zugriffsregeln
--
-- "security definer" ist hier entscheidend: Die Funktionen dürfen die
-- nutzer-Tabelle lesen, ohne selbst wieder durch die Zugriffsregeln zu
-- laufen. Ohne das würde sich eine Regel auf nutzer endlos selbst aufrufen.
-- ---------------------------------------------------------------------------
create or replace function public.ist_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select n.rolle = 'admin' from public.nutzer n where n.id = (select auth.uid())),
    false
  )
$$;

create or replace function public.mein_betrieb_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select n.betrieb_id from public.nutzer n where n.id = (select auth.uid())
$$;


-- ---------------------------------------------------------------------------
-- Row Level Security einschalten
--
-- Ab hier gilt: Ohne ausdrückliche Erlaubnis sieht niemand eine einzige Zeile.
-- ---------------------------------------------------------------------------
alter table public.betriebe    enable row level security;
alter table public.nutzer      enable row level security;
alter table public.anrufe      enable row level security;
alter table public.bewertungen enable row level security;
alter table public.tokens      enable row level security;


-- Lesen: Admin sieht alles, Betriebsnutzer nur den eigenen Betrieb.
drop policy if exists "betriebe_lesen" on public.betriebe;
create policy "betriebe_lesen" on public.betriebe
  for select to authenticated
  using (public.ist_admin() or id = public.mein_betrieb_id());

-- Ändern (z. B. Paket zuweisen) darf nur der Admin.
drop policy if exists "betriebe_admin_aendern" on public.betriebe;
create policy "betriebe_admin_aendern" on public.betriebe
  for update to authenticated
  using (public.ist_admin())
  with check (public.ist_admin());

drop policy if exists "nutzer_lesen" on public.nutzer;
create policy "nutzer_lesen" on public.nutzer
  for select to authenticated
  using (id = (select auth.uid()) or public.ist_admin());

drop policy if exists "anrufe_lesen" on public.anrufe;
create policy "anrufe_lesen" on public.anrufe
  for select to authenticated
  using (public.ist_admin() or betrieb_id = public.mein_betrieb_id());

drop policy if exists "bewertungen_lesen" on public.bewertungen;
create policy "bewertungen_lesen" on public.bewertungen
  for select to authenticated
  using (public.ist_admin() or betrieb_id = public.mein_betrieb_id());


-- tokens bekommt ABSICHTLICH keine einzige Regel.
-- Damit ist die Tabelle für angemeldete Nutzer und für Besucher vollständig
-- gesperrt. Nur der Server mit dem geheimen Schlüssel kommt heran -- und der
-- ist der Einzige, der Einmal-Links prüfen muss.
revoke all on public.tokens from anon, authenticated;


-- Schreibzugriffe (Webhook, SMS-Versand, Bewertung) laufen ausschließlich
-- über den Server mit dem geheimen Schlüssel. Deshalb gibt es hier bewusst
-- keine insert- oder update-Regeln für angemeldete Nutzer.


-- ---------------------------------------------------------------------------
-- Kontrollausgabe: zeigt nach dem Ausführen, ob alles steht.
-- ---------------------------------------------------------------------------
select
  c.relname                                          as tabelle,
  c.relrowsecurity                                   as rls_aktiv,
  (select count(*) from pg_policies p
    where p.schemaname = 'public' and p.tablename = c.relname) as anzahl_regeln
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in ('betriebe', 'nutzer', 'anrufe', 'bewertungen', 'tokens')
order by c.relname;
