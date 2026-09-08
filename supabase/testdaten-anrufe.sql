-- ============================================================================
-- Legt 14 Testanrufe über drei Kampagnen an und bewertet die meisten davon.
--
-- Nur zum Ansehen der Auswertung, solange matelso fehlt. Alle Datensätze
-- tragen das Präfix "TEST-" und lassen sich mit testdaten-loeschen.sql
-- restlos wieder entfernen.
--
-- Die drei jüngsten Anrufe bleiben absichtlich unbewertet, damit auch der
-- Zustand "offen" in der Liste vorkommt.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Anrufe -- verteilt über die letzten Tage
-- ---------------------------------------------------------------------------
insert into public.anrufe
  (betrieb_id, matelso_id, anrufer_nummer, angerufene_nummer,
   beginn, dauer_sekunden, kampagne, anzeigengruppe, keyword, gclid)
select
  b.id,
  'TEST-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' || g,
  '+43 664 ' || lpad(((g * 137717) % 10000000)::text, 7, '0'),
  b.telefon,
  now() - (g * 7 || ' hours')::interval,
  45 + (g * 53) % 420,
  (array['Dachsanierung Wien', 'Bad sanieren Graz', 'Notdienst rund um die Uhr'])[1 + (g % 3)],
  'Anzeigengruppe ' || (1 + (g % 2)),
  (array['dachdecker wien', 'dach reparatur kosten', 'installateur graz',
         'bad umbau preis', 'rohrbruch notdienst', 'sanitaer notdienst wien'])[1 + (g % 6)],
  'TEST-gclid-' || g
from public.betriebe b
cross join generate_series(1, 14) as g
where b.id = (select id from public.betriebe order by angelegt_am limit 1);


-- ---------------------------------------------------------------------------
-- 2. Bewertungen -- alle bis auf die drei jüngsten
--
-- Der Betrag wird aus den Wertstufen des Betriebs abgeleitet, genau wie es
-- die Funktion bewertung_speichern() im Echtbetrieb tut.
-- ---------------------------------------------------------------------------
insert into public.bewertungen (anruf_id, betrieb_id, ergebnis, wert_cent)
select
  s.id,
  s.betrieb_id,
  s.ergebnis,
  case s.ergebnis
    when 'kein_auftrag' then 0
    when 'klein'        then s.wert_klein_cent
    when 'mittel'       then s.wert_mittel_cent
    when 'gross'        then s.wert_gross_cent
  end
from (
  select
    a.id,
    a.betrieb_id,
    b.wert_klein_cent,
    b.wert_mittel_cent,
    b.wert_gross_cent,
    (array['gross', 'mittel', 'kein_auftrag', 'klein', 'mittel', 'gross',
           'klein', 'mittel', 'kein_auftrag', 'gross', 'mittel', 'klein'])[
      1 + ((row_number() over (order by a.beginn desc))::int - 1) % 12
    ] as ergebnis,
    row_number() over (order by a.beginn desc) as nr
  from public.anrufe a
  join public.betriebe b on b.id = a.betrieb_id
  where a.matelso_id like 'TEST-%'
    and not exists (
      select 1 from public.bewertungen bw where bw.anruf_id = a.id
    )
) s
where s.nr > 3;


-- ---------------------------------------------------------------------------
-- Kontrollausgabe
-- ---------------------------------------------------------------------------
select
  (select count(*) from public.anrufe where matelso_id like 'TEST-%') as testanrufe,
  (select count(*) from public.bewertungen)                           as bewertungen,
  (select count(distinct kampagne) from public.anrufe
     where matelso_id like 'TEST-%')                                  as kampagnen,
  (select to_char(sum(wert_cent) / 100.0, 'FM999G999D00')
     from public.bewertungen)                                         as auftragswert_eur;
