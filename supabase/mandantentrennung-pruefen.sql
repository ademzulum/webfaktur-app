-- ============================================================================
-- Nachweis der Mandantentrennung
--
-- Prüft die entscheidende Frage: Sieht ein Betrieb die Anrufe eines anderen?
--
-- WICHTIG: Diese Datei verändert NICHTS dauerhaft. Alles läuft in einer
-- Transaktion, die am Ende mit "rollback" verworfen wird - inklusive der
-- beiden Testkonten. Es bleiben keine Testdaten und keine Testanmeldungen
-- zurück, um die man sich später kümmern müsste.
--
-- Aufbau:
--   Betrieb A  ->  1 Nutzer,  2 Anrufe,  1 Bewertung
--   Betrieb B  ->  1 Nutzer,  3 Anrufe,  2 Bewertungen
--
-- Die Anzahlen sind bewusst verschieden. Wäre die Trennung undicht, sähe
-- jeder 5 Anrufe - das fiele sofort auf.
-- ============================================================================

begin;


-- ---------------------------------------------------------------------------
-- 1. Zwei Anmeldekonten. Die nutzer-Tabelle verweist auf auth.users,
--    deshalb müssen sie existieren, bevor Nutzer angelegt werden können.
-- ---------------------------------------------------------------------------
insert into auth.users (instance_id, id, aud, role, email, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000',
   'aaaaaaaa-0000-4000-8000-000000000001',
   'authenticated', 'authenticated', 'test-a@example.com', now(), now()),
  ('00000000-0000-0000-0000-000000000000',
   'bbbbbbbb-0000-4000-8000-000000000002',
   'authenticated', 'authenticated', 'test-b@example.com', now(), now());


-- ---------------------------------------------------------------------------
-- 2. Zwei Betriebe mit unterschiedlichen Wertstufen
-- ---------------------------------------------------------------------------
insert into public.betriebe
  (id, name, telefon, wert_klein_cent, wert_mittel_cent, wert_gross_cent)
values
  ('a0000000-0000-4000-8000-000000000001', 'Testbetrieb A Dachdecker',
   '+436640000001', 20000, 80000, 250000),
  ('b0000000-0000-4000-8000-000000000002', 'Testbetrieb B Installateur',
   '+436640000002', 30000, 120000, 400000);


-- ---------------------------------------------------------------------------
-- 3. Je ein Betriebsnutzer
-- ---------------------------------------------------------------------------
insert into public.nutzer (id, betrieb_id, rolle, name)
values
  ('aaaaaaaa-0000-4000-8000-000000000001',
   'a0000000-0000-4000-8000-000000000001', 'betrieb', 'Testnutzer A'),
  ('bbbbbbbb-0000-4000-8000-000000000002',
   'b0000000-0000-4000-8000-000000000002', 'betrieb', 'Testnutzer B');


-- ---------------------------------------------------------------------------
-- 4. Anrufe -- A bekommt zwei, B bekommt drei
-- ---------------------------------------------------------------------------
insert into public.anrufe
  (betrieb_id, matelso_id, anrufer_nummer, beginn, dauer_sekunden, kampagne, keyword)
values
  ('a0000000-0000-4000-8000-000000000001', 'test-a-1', '+436641111111',
   now() - interval '3 hours', 180, 'Dachsanierung Wien', 'dachdecker wien'),
  ('a0000000-0000-4000-8000-000000000001', 'test-a-2', '+436642222222',
   now() - interval '2 hours',  45, 'Dachsanierung Wien', 'dach reparatur'),
  ('b0000000-0000-4000-8000-000000000002', 'test-b-1', '+436643333333',
   now() - interval '5 hours', 300, 'Bad sanieren Graz', 'installateur graz'),
  ('b0000000-0000-4000-8000-000000000002', 'test-b-2', '+436644444444',
   now() - interval '4 hours', 120, 'Bad sanieren Graz', 'bad umbau'),
  ('b0000000-0000-4000-8000-000000000002', 'test-b-3', '+436645555555',
   now() - interval '1 hour',   90, 'Notdienst Graz', 'rohrbruch notdienst');


-- ---------------------------------------------------------------------------
-- 5. Bewertungen -- A eine, B zwei
-- ---------------------------------------------------------------------------
insert into public.bewertungen (anruf_id, betrieb_id, ergebnis, wert_cent)
select a.id, a.betrieb_id, 'mittel',        80000  from public.anrufe a where a.matelso_id = 'test-a-1'
union all
select a.id, a.betrieb_id, 'gross',        400000  from public.anrufe a where a.matelso_id = 'test-b-1'
union all
select a.id, a.betrieb_id, 'kein_auftrag',      0  from public.anrufe a where a.matelso_id = 'test-b-2';


-- ---------------------------------------------------------------------------
-- 6. Sammeltabelle für die Ergebnisse.
--    Auch sie verschwindet beim rollback wieder.
-- ---------------------------------------------------------------------------
create table public.pruefergebnis (
  nr                    int,
  szenario              text,
  sichtbare_betriebe    bigint,
  sichtbare_anrufe      bigint,
  sichtbare_bewertungen bigint,
  davon_vom_anderen     bigint,
  erwartet              text
);
grant all on public.pruefergebnis to authenticated;


-- ---------------------------------------------------------------------------
-- Szenario 1: angemeldet als Nutzer von Betrieb A
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims',
  json_build_object('sub', 'aaaaaaaa-0000-4000-8000-000000000001',
                    'role', 'authenticated')::text, true);
set local role authenticated;

insert into public.pruefergebnis
select 1, 'Nutzer von Betrieb A',
  (select count(*) from public.betriebe),
  (select count(*) from public.anrufe),
  (select count(*) from public.bewertungen),
  (select count(*) from public.anrufe
     where betrieb_id = 'b0000000-0000-4000-8000-000000000002'),
  '1 / 2 / 1 / 0';

reset role;


-- ---------------------------------------------------------------------------
-- Szenario 2: angemeldet als Nutzer von Betrieb B
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims',
  json_build_object('sub', 'bbbbbbbb-0000-4000-8000-000000000002',
                    'role', 'authenticated')::text, true);
set local role authenticated;

insert into public.pruefergebnis
select 2, 'Nutzer von Betrieb B',
  (select count(*) from public.betriebe),
  (select count(*) from public.anrufe),
  (select count(*) from public.bewertungen),
  (select count(*) from public.anrufe
     where betrieb_id = 'a0000000-0000-4000-8000-000000000001'),
  '1 / 3 / 2 / 0';

reset role;


-- ---------------------------------------------------------------------------
-- Szenario 3: angemeldet als Admin -- muss alles sehen
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims',
  json_build_object('sub', (select n.id from public.nutzer n
                              where n.rolle = 'admin' limit 1),
                    'role', 'authenticated')::text, true);
set local role authenticated;

insert into public.pruefergebnis
select 3, 'Admin (Agenturinhaber)',
  (select count(*) from public.betriebe),
  (select count(*) from public.anrufe),
  (select count(*) from public.bewertungen),
  (select count(*) from public.anrufe
     where betrieb_id = 'b0000000-0000-4000-8000-000000000002'),
  '2 / 5 / 3 / 3';

reset role;


-- ---------------------------------------------------------------------------
-- Ergebnis
-- ---------------------------------------------------------------------------
select * from public.pruefergebnis order by nr;


-- Verwirft alles: Testkonten, Betriebe, Anrufe, Bewertungen, Sammeltabelle.
rollback;
