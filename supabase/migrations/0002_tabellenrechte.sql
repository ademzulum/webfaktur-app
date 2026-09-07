-- ============================================================================
-- 0002  Tabellenrechte nachziehen
--
-- Postgres prüft Zugriffe in zwei Stufen:
--   1. GRANT  -- darf diese Rolle die Tabelle überhaupt anfassen?
--   2. RLS    -- und wenn ja, welche Zeilen davon?
--
-- Migration 0001 hat nur Stufe 2 gesetzt. Ohne Stufe 1 scheitert schon der
-- Zugriff auf die Tabelle, und die Zeilenregeln werden nie ausgewertet.
--
-- Grundsatz hier: so wenig Rechte wie möglich. Die Rolle "anon" (jeder
-- Besucher ohne Anmeldung) bekommt auf keine einzige Tabelle Zugriff.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- Angemeldete Nutzer: nur lesen. Welche Zeilen sie dabei sehen, entscheiden
-- weiterhin die Regeln aus 0001.
-- ---------------------------------------------------------------------------
grant usage on schema public to authenticated;

grant select on public.betriebe    to authenticated;
grant select on public.nutzer      to authenticated;
grant select on public.anrufe      to authenticated;
grant select on public.bewertungen to authenticated;

-- Einzige Ausnahme: Der Admin darf Betriebe bearbeiten (Paket zuweisen).
-- Dass wirklich nur der Admin durchkommt, stellt die Regel
-- "betriebe_admin_aendern" aus 0001 sicher.
grant update on public.betriebe to authenticated;


-- ---------------------------------------------------------------------------
-- Nicht angemeldete Besucher: nichts. Ausdrücklich entzogen, damit es auch
-- dann gilt, wenn Supabase bei neuen Tabellen etwas voreinstellt.
-- ---------------------------------------------------------------------------
revoke all on public.betriebe    from anon;
revoke all on public.nutzer      from anon;
revoke all on public.anrufe      from anon;
revoke all on public.bewertungen from anon;
revoke all on public.tokens      from anon;

-- tokens bleibt auch für angemeldete Nutzer gesperrt.
revoke all on public.tokens from authenticated;


-- ---------------------------------------------------------------------------
-- Kontrollausgabe: Wer darf was?
-- ---------------------------------------------------------------------------
select
  t.table_name                                as tabelle,
  coalesce(string_agg(distinct t.privilege_type, ', ' order by t.privilege_type)
             filter (where t.grantee = 'authenticated'), '-- keine --') as angemeldet,
  coalesce(string_agg(distinct t.privilege_type, ', ' order by t.privilege_type)
             filter (where t.grantee = 'anon'), '-- keine --')          as besucher
from information_schema.role_table_grants t
where t.table_schema = 'public'
  and t.table_name in ('betriebe', 'nutzer', 'anrufe', 'bewertungen', 'tokens')
group by t.table_name
order by t.table_name;
