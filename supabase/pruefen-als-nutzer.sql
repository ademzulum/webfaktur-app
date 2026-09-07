-- ============================================================================
-- Prüfung: Was sieht ein ANGEMELDETER Nutzer tatsächlich?
--
-- Der SQL Editor arbeitet sonst mit vollen Rechten und umgeht damit alle
-- Zugriffsregeln - eine Abfrage dort beweist also gar nichts. Dieser Block
-- schlüpft bewusst in die Rolle eines angemeldeten Nutzers.
--
-- Es wird nichts verändert: Alles läuft in einer Transaktion, die am Ende
-- wieder zurückgerollt wird.
-- ============================================================================

begin;

-- In die Haut des Admin-Kontos schlüpfen
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub',  (select n.id from public.nutzer n where n.rolle = 'admin' limit 1),
    'role', 'authenticated'
  )::text,
  true
);

set local role authenticated;

select
  current_user                            as aktive_rolle,
  auth.uid()                              as erkannte_nutzer_id,
  public.ist_admin()                      as wird_als_admin_erkannt,
  public.mein_betrieb_id()                as eigener_betrieb,
  (select count(*) from public.nutzer)    as sichtbare_nutzer,
  (select count(*) from public.betriebe)  as sichtbare_betriebe,
  (select count(*) from public.anrufe)    as sichtbare_anrufe;

rollback;
