-- ============================================================================
-- 0004  Der Admin darf Betriebe anlegen
--
-- Bisher durften angemeldete Nutzer betriebe nur lesen und ändern. Zum
-- Anlegen fehlten sowohl das Tabellenrecht (INSERT) als auch die Regel.
--
-- Bewusst NICHT über den geheimen Serverschlüssel gelöst: Der umgeht sämtliche
-- Zugriffsregeln. Dann läge die Entscheidung "darf dieser Nutzer das?" wieder
-- im Anwendungscode - genau dort, wo sie laut Vorgabe nicht liegen soll.
--
-- Löschen bleibt absichtlich aus. Ein Betrieb wird über "aktiv = false"
-- stillgelegt, nicht entfernt - sonst verschwänden seine Anrufe gleich mit.
-- ============================================================================

grant insert on public.betriebe to authenticated;

drop policy if exists "betriebe_admin_anlegen" on public.betriebe;
create policy "betriebe_admin_anlegen" on public.betriebe
  for insert to authenticated
  with check (public.ist_admin());


-- ---------------------------------------------------------------------------
-- Kontrollausgabe
-- ---------------------------------------------------------------------------
select
  tabelle,
  coalesce(string_agg(recht, ', ' order by recht)
             filter (where has_table_privilege('authenticated', tabelle, recht)),
           '-- keine --') as angemeldet,
  coalesce(string_agg(recht, ', ' order by recht)
             filter (where has_table_privilege('anon', tabelle, recht)),
           '-- keine --') as besucher
from
  unnest(array['public.betriebe', 'public.nutzer', 'public.anrufe',
               'public.bewertungen', 'public.tokens']) as tabelle,
  unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE',
               'TRUNCATE', 'REFERENCES', 'TRIGGER']) as recht
group by tabelle
order by tabelle;
