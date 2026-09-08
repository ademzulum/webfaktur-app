-- ============================================================================
-- Testdaten entfernen
--
-- Löscht ALLE Anrufe, Bewertungen und Bewertungslinks. Betriebe und Zugänge
-- bleiben stehen.
--
-- ACHTUNG: Das ist nicht rückgängig zu machen. Gedacht für den Übergang von
-- der Erprobung zum echten Betrieb - also für jetzt, solange nur Testanrufe
-- in der Datenbank stehen. Ist erst einmal ein echter Anruf erfasst, darf
-- diese Datei NICHT mehr im Ganzen laufen.
--
-- Ausführen im Supabase-SQL-Editor. Er läuft mit vollen Rechten, die
-- Zugriffsregeln greifen hier also nicht.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Erst ansehen, was verschwinden würde
--
-- Bewusst als eigener Schritt: Steht hier eine Zahl, die dich überrascht,
-- brich ab. Nach dem Löschen ist es zu spät für diese Überlegung.
-- ---------------------------------------------------------------------------
select
  (select count(*) from public.anrufe)      as anrufe,
  (select count(*) from public.bewertungen) as bewertungen,
  (select count(*) from public.tokens)      as bewertungslinks,
  (select count(*) from public.betriebe)    as betriebe_bleiben_erhalten,
  (select count(*) from public.nutzer)      as zugaenge_bleiben_erhalten;


-- ---------------------------------------------------------------------------
-- 2. Löschen
--
-- Es genügt, die Anrufe zu löschen: Bewertungen und Bewertungslinks hängen
-- über "on delete cascade" daran und verschwinden von selbst mit. Sie hier
-- einzeln aufzuführen wäre nicht falsch, aber überflüssig - und es würde
-- den Eindruck erwecken, man müsse an drei Stellen aufräumen.
-- ---------------------------------------------------------------------------
delete from public.anrufe;


-- ---------------------------------------------------------------------------
-- 3. Kontrolle: Überall muss jetzt 0 stehen.
-- ---------------------------------------------------------------------------
select
  (select count(*) from public.anrufe)      as anrufe,
  (select count(*) from public.bewertungen) as bewertungen,
  (select count(*) from public.tokens)      as bewertungslinks;


-- ---------------------------------------------------------------------------
-- Falls du auch einen Test-BETRIEB loswerden willst
--
-- Bewusst nicht Teil des Löschens oben: An einem Betrieb hängen die Zugänge
-- seiner Nutzer. Den falschen zu löschen wäre schmerzhafter als ein paar
-- Testanrufe zu viel.
--
-- Erst nachsehen, welche es gibt:
--
--   select id, name, paket, aktiv from public.betriebe order by name;
--
-- Dann gezielt einen löschen - Name genau abschreiben:
--
--   delete from public.betriebe where name = 'Testbetrieb GmbH';
--
-- Die Anmeldekonten dazu verschwinden damit NICHT. Die stehen in der
-- Kontenverwaltung von Supabase (Authentication -> Users) und müssen dort
-- entfernt werden - oder bequemer über "Zugänge" in der Anwendung, BEVOR
-- der Betrieb gelöscht wird.
-- ---------------------------------------------------------------------------
