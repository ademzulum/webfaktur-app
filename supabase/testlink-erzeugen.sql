-- ============================================================================
-- Erzeugt einen Testanruf samt Bewertungslink.
--
-- Nur zum Ausprobieren, solange matelso und Twilio noch fehlen. Alle
-- Testanrufe bekommen eine matelso_id mit dem Präfix "TEST-" und lassen sich
-- damit später gezielt wieder entfernen (siehe testdaten-loeschen.sql).
--
-- Anders als die Prüfdateien bleibt das hier BESTEHEN - sonst gäbe es keinen
-- Link zum Anklicken.
-- ============================================================================

-- Der Anruf wird dem zuerst angelegten Betrieb zugeordnet.
insert into public.anrufe
  (betrieb_id, matelso_id, anrufer_nummer, angerufene_nummer,
   beginn, dauer_sekunden, kampagne, anzeigengruppe, keyword, gclid)
select
  b.id,
  'TEST-' || substr(md5(random()::text), 1, 8),
  '+43 664 1234567',
  b.telefon,
  now() - interval '12 minutes',
  187,
  'Testkampagne',
  'Testanzeigengruppe',
  'testbegriff',
  'TEST-gclid'
from public.betriebe b
order by b.angelegt_am
limit 1;


-- Der Token. Der Klartext steht NUR hier, damit du den Link bauen kannst;
-- in der Datenbank landet ausschließlich der Hash.
insert into public.tokens (anruf_id, betrieb_id, token_hash, gueltig_bis)
select
  a.id,
  a.betrieb_id,
  encode(sha256(convert_to('TESTLINK-BITTE-NUR-ZUM-PROBIEREN', 'UTF8')), 'hex'),
  now() + interval '48 hours'
from public.anrufe a
where a.matelso_id like 'TEST-%'
order by a.angelegt_am desc
limit 1
on conflict (token_hash) do update
  set anruf_id     = excluded.anruf_id,
      betrieb_id   = excluded.betrieb_id,
      gueltig_bis  = excluded.gueltig_bis,
      verwendet_am = null;


-- ---------------------------------------------------------------------------
-- Der fertige Link
-- ---------------------------------------------------------------------------
select
  'http://localhost:3000/bewerten/TESTLINK-BITTE-NUR-ZUM-PROBIEREN' as link,
  b.name        as betrieb,
  a.matelso_id  as testanruf,
  t.gueltig_bis as gueltig_bis
from public.tokens t
join public.anrufe   a on a.id = t.anruf_id
join public.betriebe b on b.id = t.betrieb_id
where t.token_hash = encode(sha256(convert_to('TESTLINK-BITTE-NUR-ZUM-PROBIEREN', 'UTF8')), 'hex');
