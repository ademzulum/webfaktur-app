-- ============================================================================
-- 0008  Kennzahlen der Übersicht in einer Abfrage
--
-- WARUM DAS SEIN MUSS - das ist kein Aufräumen, sondern eine Fehlerbehebung:
--
-- Die Übersicht hat die Summe der Auftragswerte gebildet, indem sie ALLE
-- Bewertungen geladen und im Programm zusammengezählt hat. Supabase liefert
-- über die Schnittstelle aber höchstens 1000 Zeilen pro Abfrage - ohne
-- Fehlermeldung, ohne Hinweis. Ab der 1001. Bewertung wäre die angezeigte
-- Summe also zu klein gewesen, und niemand hätte es gemerkt. Genau solche
-- Fehler sind die schlimmsten: Die Zahl sieht richtig aus.
--
-- Hier wird stattdessen in der Datenbank gezählt. Dort gibt es keine Grenze,
-- und statt fünf Abfragen ist es nur noch eine.
--
-- Bewusst OHNE "security definer": Die Funktion läuft mit den Rechten dessen,
-- der sie aufruft. Damit gelten die Zugriffsregeln unverändert weiter - ein
-- Betriebsnutzer zählt ausschließlich seine eigenen Zeilen, der Admin alle.
-- Wäre sie mit erhöhten Rechten angelegt, sähe jeder die Zahlen aller
-- Betriebe. Das wäre ein Bruch der Mandantentrennung.
-- ============================================================================

create or replace function public.kennzahlen()
returns table (
  anrufe        bigint,
  bewertungen   bigint,
  auftraege     bigint,
  wert_summe    bigint,
  betriebe      bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    (select count(*) from public.anrufe),
    (select count(*) from public.bewertungen),
    (select count(*) from public.bewertungen where ergebnis <> 'kein_auftrag'),
    (select coalesce(sum(wert_cent), 0) from public.bewertungen),
    (select count(*) from public.betriebe)
$$;

-- Nur angemeldete Nutzer. "anon" bekommt das Recht bewusst nicht.
revoke all on function public.kennzahlen() from public, anon;
grant execute on function public.kennzahlen() to authenticated;


-- ---------------------------------------------------------------------------
-- Kontrolle: Als angemeldeter Nutzer ausgeführt muss das die eigenen Zahlen
-- liefern. Als anon muss es mit einer Rechteverletzung fehlschlagen.
--
--   select * from public.kennzahlen();
-- ---------------------------------------------------------------------------
