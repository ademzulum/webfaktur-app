-- ============================================================================
-- Nachweis: Ein Betriebsnutzer sieht KEINE Kostendaten
--
-- Die entscheidende Frage: Bekommt ein normaler Betriebsnutzer irgendetwas
-- aus preiskonfiguration oder zahlungen zurück - auch nur die eigene Zeile?
--
-- Die Antwort muss überall 0 lauten. Auch bei "eigene_zeile". Das ist der
-- Unterschied zu den Anrufen: Dort ist "sehe meine eigene Zeile" richtig,
-- hier wäre genau das der Fehler.
--
-- WICHTIG: Diese Datei verändert NICHTS dauerhaft. Alles läuft in einer
-- Transaktion, die am Ende mit "rollback" verworfen wird - inklusive der
-- Testkonten, Testbetriebe und Testpreise.
--
-- Zwei Betriebe mit UNTERSCHIEDLICHEN Preisen. Wäre der Schutz undicht,
-- sähe man an den Zahlen sofort, welche durchgesickert sind.
-- ============================================================================

begin;


-- ---------------------------------------------------------------------------
-- 1. Zwei Anmeldekonten
-- ---------------------------------------------------------------------------
insert into auth.users (instance_id, id, aud, role, email, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000',
   'cccccccc-0000-4000-8000-000000000001',
   'authenticated', 'authenticated', 'kosten-a@example.com', now(), now()),
  ('00000000-0000-0000-0000-000000000000',
   'dddddddd-0000-4000-8000-000000000002',
   'authenticated', 'authenticated', 'kosten-b@example.com', now(), now());


-- ---------------------------------------------------------------------------
-- 2. Zwei Betriebe, je ein Betriebsnutzer
-- ---------------------------------------------------------------------------
insert into public.betriebe (id, name, telefon)
values
  ('c0000000-0000-4000-8000-000000000001', 'Kostentest A', '+436640000011'),
  ('d0000000-0000-4000-8000-000000000002', 'Kostentest B', '+436640000022');

insert into public.nutzer (id, betrieb_id, rolle, name)
values
  ('cccccccc-0000-4000-8000-000000000001',
   'c0000000-0000-4000-8000-000000000001', 'betrieb', 'Kostennutzer A'),
  ('dddddddd-0000-4000-8000-000000000002',
   'd0000000-0000-4000-8000-000000000002', 'betrieb', 'Kostennutzer B');


-- ---------------------------------------------------------------------------
-- 3. Preise und Zahlungsstatus -- bewusst verschieden
-- ---------------------------------------------------------------------------
insert into public.preiskonfiguration
  (betrieb_id, paket, verkaufspreis_monatlich_cent,
   matelso_kosten_geschaetzt_monatlich_cent, vertragsbeginn,
   mindestlaufzeit_monate)
values
  ('c0000000-0000-4000-8000-000000000001', 'basis',
   29900, 9000, date '2025-03-01', 12),
  ('d0000000-0000-4000-8000-000000000002', 'premium',
   79900, 15000, date '2025-09-15', 24);

insert into public.zahlungen (betrieb_id, monat, status)
values
  ('c0000000-0000-4000-8000-000000000001',
   date_trunc('month', now())::date, 'bezahlt'),
  ('d0000000-0000-4000-8000-000000000002',
   date_trunc('month', now())::date, 'offen');


-- ---------------------------------------------------------------------------
-- 4. Ein paar Anrufe, damit die Auswertung etwas zu rechnen hat
-- ---------------------------------------------------------------------------
insert into public.anrufe (betrieb_id, matelso_id, anrufer_nummer, beginn, dauer_sekunden)
values
  ('c0000000-0000-4000-8000-000000000001', 'kosten-a-1', '+436641111111', now() - interval '2 hours', 200),
  ('c0000000-0000-4000-8000-000000000001', 'kosten-a-2', '+436641111112', now() - interval '3 hours', 100),
  ('d0000000-0000-4000-8000-000000000002', 'kosten-b-1', '+436641111113', now() - interval '4 hours', 300);

insert into public.bewertungen (anruf_id, betrieb_id, ergebnis, wert_cent)
select a.id, a.betrieb_id, 'mittel', 100000
  from public.anrufe a where a.matelso_id = 'kosten-a-1';


-- ---------------------------------------------------------------------------
-- 5. Sammeltabelle für die Ergebnisse
--
-- Supabase schaltet bei jeder neu angelegten Tabelle im public-Schema die
-- Zeilenregeln automatisch ein. Diese hier ist nur ein Messwerkzeug und
-- muss von den Testrollen beschrieben werden können.
-- ---------------------------------------------------------------------------
create table public.kostenergebnis (
  nr                 int,
  szenario           text,
  preiszeilen        bigint,
  davon_eigene       bigint,
  zahlungszeilen     bigint,
  auswertung_zeilen  bigint,
  verlauf_zeilen     bigint,
  erwartet           text
);
grant all on public.kostenergebnis to authenticated;
alter table public.kostenergebnis disable row level security;


-- ---------------------------------------------------------------------------
-- Szenario 1: Betriebsnutzer A
--
-- "davon_eigene" ist die eigentliche Prüfung. Eine Regel wie
-- "betrieb_id = mein_betrieb_id()" wäre hier durchgerutscht - sie klingt
-- vernünftig und ist an dieser Tabelle trotzdem falsch.
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims',
  json_build_object('sub', 'cccccccc-0000-4000-8000-000000000001',
                    'role', 'authenticated')::text, true);
set local role authenticated;

insert into public.kostenergebnis
select 1, 'Betriebsnutzer A',
  (select count(*) from public.preiskonfiguration),
  (select count(*) from public.preiskonfiguration
     where betrieb_id = 'c0000000-0000-4000-8000-000000000001'),
  (select count(*) from public.zahlungen),
  (select count(*) from public.kostenuebersicht()),
  (select count(*) from public.kostenverlauf(6)),
  'alles 0';

reset role;


-- ---------------------------------------------------------------------------
-- Szenario 2: Betriebsnutzer B
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims',
  json_build_object('sub', 'dddddddd-0000-4000-8000-000000000002',
                    'role', 'authenticated')::text, true);
set local role authenticated;

insert into public.kostenergebnis
select 2, 'Betriebsnutzer B',
  (select count(*) from public.preiskonfiguration),
  (select count(*) from public.preiskonfiguration
     where betrieb_id = 'd0000000-0000-4000-8000-000000000002'),
  (select count(*) from public.zahlungen),
  (select count(*) from public.kostenuebersicht()),
  (select count(*) from public.kostenverlauf(6)),
  'alles 0';

reset role;


-- ---------------------------------------------------------------------------
-- Szenario 3: Admin -- muss beide sehen, sonst ist die Regel zu streng
--
-- Ohne diesen dritten Fall wäre die Prüfung wertlos: Eine Tabelle, auf die
-- NIEMAND zugreifen darf, bestünde die ersten beiden Fälle mühelos und wäre
-- trotzdem unbrauchbar.
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims',
  json_build_object('sub', (select n.id from public.nutzer n
                              where n.rolle = 'admin' limit 1),
                    'role', 'authenticated')::text, true);
set local role authenticated;

insert into public.kostenergebnis
select 3, 'Admin (Agenturinhaber)',
  (select count(*) from public.preiskonfiguration),
  (select count(*) from public.preiskonfiguration
     where betrieb_id in ('c0000000-0000-4000-8000-000000000001',
                          'd0000000-0000-4000-8000-000000000002')),
  (select count(*) from public.zahlungen),
  (select count(*) from public.kostenuebersicht()),
  (select count(*) from public.kostenverlauf(6)),
  'mind. 2 / 2 / 2 / 2 / 12';

reset role;


-- ---------------------------------------------------------------------------
-- Szenario 4: Schreiben. Darf ein Betriebsnutzer sich einen Preis eintragen?
--
-- Lesen zu verbieten genügt nicht. Wer schreiben darf, kann sich einen Wert
-- setzen und ihn anschließend an anderer Stelle wiedersehen - oder schlicht
-- Unsinn anrichten.
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims',
  json_build_object('sub', 'cccccccc-0000-4000-8000-000000000001',
                    'role', 'authenticated')::text, true);
set local role authenticated;

do $$
declare
  v_meldung text;
begin
  begin
    insert into public.preiskonfiguration
      (betrieb_id, verkaufspreis_monatlich_cent)
    values ('c0000000-0000-4000-8000-000000000001', 1);
    v_meldung := 'FEHLER: Anlegen war erlaubt';
  exception when others then
    v_meldung := 'abgewiesen (' || sqlstate || ')';
  end;

  insert into public.kostenergebnis
  values (4, 'Betriebsnutzer A legt Preis an: ' || v_meldung,
          null, null, null, null, null, 'abgewiesen (42501)');

  begin
    update public.preiskonfiguration
       set verkaufspreis_monatlich_cent = 1
     where betrieb_id = 'd0000000-0000-4000-8000-000000000002';
    -- Kein Fehler heißt hier NICHT "erlaubt": Die Zeilenregeln lassen ein
    -- update ins Leere laufen, wenn keine Zeile sichtbar ist. Deshalb wird
    -- gezählt, wie viele Zeilen tatsächlich geändert wurden.
    get diagnostics v_meldung = row_count;
    v_meldung := 'geaenderte Zeilen: ' || v_meldung;
  exception when others then
    v_meldung := 'abgewiesen (' || sqlstate || ')';
  end;

  insert into public.kostenergebnis
  values (5, 'Betriebsnutzer A aendert fremden Preis: ' || v_meldung,
          null, null, null, null, null, '0 Zeilen oder abgewiesen');
end $$;

reset role;


-- ---------------------------------------------------------------------------
-- 6. Stehen die Regeln überhaupt scharf?
--
-- "zeilenregeln_an" muss bei beiden Tabellen true sein. Ohne das wären die
-- Regeln darunter nur Zierde.
--
-- Diese Abfragen stehen BEWUSST vor dem eigentlichen Ergebnis: Der
-- SQL-Editor zeigt bei mehreren Abfragen nur die letzte an. Das Wichtigste
-- gehört deshalb ans Ende.
-- ---------------------------------------------------------------------------
select
  c.relname             as tabelle,
  c.relrowsecurity      as zeilenregeln_an,
  c.relforcerowsecurity as gilt_auch_fuer_eigentuemer,
  (select count(*) from pg_policies p
    where p.schemaname = 'public' and p.tablename = c.relname) as anzahl_regeln
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('preiskonfiguration', 'zahlungen')
order by c.relname;

select
  tablename  as tabelle,
  policyname as regel,
  cmd        as fuer,
  qual       as bedingung_lesen,
  with_check as bedingung_schreiben
from pg_policies
where schemaname = 'public'
  and tablename in ('preiskonfiguration', 'zahlungen')
order by tablename, cmd, policyname;


-- ---------------------------------------------------------------------------
-- 7. DAS ERGEBNIS -- das ist die Tabelle, auf die es ankommt
--
-- Zeilen 1 und 2: überall 0, auch bei "davon_eigene".
-- Zeile 3: der Admin sieht alles - sonst wäre die Regel zu streng.
-- Zeilen 4 und 5: Schreibversuche abgewiesen.
-- ---------------------------------------------------------------------------
select * from public.kostenergebnis order by nr;


-- ---------------------------------------------------------------------------
-- Alles verwerfen. Es bleibt nichts zurück.
-- ---------------------------------------------------------------------------
rollback;
