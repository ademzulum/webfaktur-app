-- ============================================================================
-- 0003  Überflüssige Rechte entziehen
--
-- Die Kontrollausgabe von 0002 hat gezeigt, dass angemeldete Nutzer auf den
-- Tabellen zusätzlich TRUNCATE, TRIGGER und REFERENCES besitzen. Vergeben hat
-- die niemand von uns - sie stammen aus einer Voreinstellung von Supabase,
-- die auf neu angelegte Tabellen automatisch alle Rechte verteilt.
--
-- Warum das nicht bleiben darf:
--   TRUNCATE   leert eine Tabelle komplett -- und wird von den Zeilenregeln
--              NICHT erfasst. RLS schützt nur einzelne Zeilen, nicht vor dem
--              Leeren der ganzen Tabelle.
--   TRIGGER    erlaubt, eigenen Code an die Tabelle zu hängen.
--   REFERENCES erlaubt, fremde Verknüpfungen darauf anzulegen.
--
-- Vorgehen: alles entziehen, danach ausschließlich das Nötige neu vergeben.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- Erst restlos entziehen ...
-- ---------------------------------------------------------------------------
revoke all on public.betriebe    from anon, authenticated;
revoke all on public.nutzer      from anon, authenticated;
revoke all on public.anrufe      from anon, authenticated;
revoke all on public.bewertungen from anon, authenticated;
revoke all on public.tokens      from anon, authenticated;


-- ---------------------------------------------------------------------------
-- ... dann genau das vergeben, was die Anwendung braucht.
-- Welche ZEILEN dabei sichtbar sind, regeln weiterhin die Regeln aus 0001.
-- ---------------------------------------------------------------------------
grant select on public.betriebe    to authenticated;
grant select on public.nutzer      to authenticated;
grant select on public.anrufe      to authenticated;
grant select on public.bewertungen to authenticated;

-- Nur damit der Admin Pakete zuweisen kann.
grant update on public.betriebe to authenticated;

-- tokens: bewusst nichts. Nur der Server mit dem geheimen Schlüssel.


-- ---------------------------------------------------------------------------
-- Die Ursache abstellen.
--
-- Ohne diese Zeile bekäme JEDE künftig angelegte Tabelle wieder automatisch
-- alle Rechte für anon und authenticated - der Fehler würde sich also bei
-- jeder neuen Tabelle wiederholen.
--
-- ACHTUNG, Folge für später: Ab jetzt ist eine neue Tabelle standardmäßig
-- für die Anwendung unsichtbar. Jede neue Tabelle braucht ihre Rechte
-- ausdrücklich, so wie oben. Das ist gewollt: lieber einmal zu wenig
-- vergeben und nachziehen, als unbemerkt zu viel.
-- ---------------------------------------------------------------------------
alter default privileges in schema public
  revoke all on tables from anon, authenticated;


-- ---------------------------------------------------------------------------
-- Kontrollausgabe -- diesmal verlässlich.
--
-- Die Abfrage in 0002 nutzte information_schema.role_table_grants. Die zeigt
-- je nach aktiver Rolle nicht zwingend alles. has_table_privilege() fragt
-- dagegen direkt: "Darf diese Rolle das?" - und ist damit die verbindliche
-- Auskunft.
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
