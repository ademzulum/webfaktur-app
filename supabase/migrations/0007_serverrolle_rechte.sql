-- ============================================================================
-- 0007  Tabellenrechte für die Serverrolle
--
-- Der geheime Serverschlüssel meldet sich als Rolle "service_role" an. Diese
-- Rolle umgeht zwar die ZEILENregeln (Row Level Security), aber nicht die
-- TABELLENrechte - dieselbe Zweiteilung wie in 0002.
--
-- In diesem Projekt hat service_role nie Rechte auf public bekommen. Der
-- Versuch, ein Anmeldekonto zuzuordnen, scheiterte deshalb mit
-- "permission denied for table".
--
-- WARUM NICHT EINFACH ALLES?
-- Die verbreitete Empfehlung lautet "grant all on all tables to service_role".
-- Das wäre hier falsch. service_role besitzt die Tabellen nicht und ist kein
-- Superuser - sie kann sich also NICHT selbst mehr Rechte geben. Damit ist
-- die Liste unten eine echte Schranke: Käme der geheime Schlüssel je
-- abhanden, könnte ein Fremder genau das und nichts weiter.
--
-- Jede künftige Server-Aufgabe (matelso-Webhook, Meldung an Google Ads)
-- bekommt ihre Rechte in einer eigenen Migration, wenn sie gebaut wird.
-- ============================================================================

-- Zum Zuordnen eines neuen Anmeldekontos zu einem Betrieb.
grant insert on public.nutzer to service_role;

-- Ausdrücklich NICHT vergeben, weil derzeit nichts davon gebraucht wird:
--   betriebe, anrufe, bewertungen, tokens  -- keinerlei Zugriff
--   nutzer: kein select, kein update, kein delete
--
-- Die Prüfung, ob der Betrieb existiert, läuft über die gewöhnliche
-- Verbindung des angemeldeten Admins. Der darf betriebe ohnehin lesen.


-- ---------------------------------------------------------------------------
-- Kontrollausgabe: Was darf die Serverrolle?
-- ---------------------------------------------------------------------------
select
  tabelle,
  coalesce(string_agg(recht, ', ' order by recht)
             filter (where has_table_privilege('service_role', tabelle, recht)),
           '-- keine --') as serverrolle,
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
