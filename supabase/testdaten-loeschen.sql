-- ============================================================================
-- Entfernt alle Testanrufe samt Tokens und Bewertungen.
--
-- Erkennungsmerkmal ist das Präfix "TEST-" in matelso_id. Echte Anrufe von
-- matelso haben eine andere Kennung und bleiben unangetastet.
-- ============================================================================

delete from public.anrufe where matelso_id like 'TEST-%';

-- tokens und bewertungen hängen per "on delete cascade" am Anruf und
-- verschwinden dadurch automatisch mit.

select
  (select count(*) from public.anrufe)      as anrufe_gesamt,
  (select count(*) from public.tokens)      as tokens_gesamt,
  (select count(*) from public.bewertungen) as bewertungen_gesamt;
