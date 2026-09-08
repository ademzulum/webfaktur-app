-- ============================================================================
-- 0006  Bewertungslink erzeugen
--
-- Legt einen Token für einen Anruf an und liefert die Mobilnummer des
-- Betriebs zurück, damit der Server die SMS verschicken kann.
--
-- WICHTIG, Unterschied zu 0005: Diese Funktion ist NICHT für Besucher
-- freigegeben. Wer beliebig Tokens erzeugen könnte, könnte jeden Anruf
-- bewerten - er müsste sich nur selbst einen Link ausstellen. Deshalb nur
-- für Angemeldete, und intern zusätzlich auf den Admin beschränkt.
-- ============================================================================

create or replace function public.bewertungslink_erzeugen(
  p_anruf_id        uuid,
  p_token_hash      text,
  p_gueltig_stunden integer default 48
)
returns table (telefon text, betrieb_name text)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_anruf   public.anrufe;
  v_betrieb public.betriebe;
begin
  if not public.ist_admin() then
    raise exception 'Nicht berechtigt' using errcode = '42501';
  end if;

  select * into v_anruf from public.anrufe where id = p_anruf_id;
  if not found then
    raise exception 'Anruf nicht gefunden' using errcode = 'P0002';
  end if;

  -- Für einen bereits bewerteten Anruf gibt es nichts mehr zu holen.
  if exists (select 1 from public.bewertungen b where b.anruf_id = p_anruf_id) then
    raise exception 'Dieser Anruf wurde bereits bewertet' using errcode = 'P0001';
  end if;

  select * into v_betrieb from public.betriebe where id = v_anruf.betrieb_id;
  if not found then
    raise exception 'Betrieb nicht gefunden' using errcode = 'P0002';
  end if;

  -- Frühere, noch offene Links für denselben Anruf sofort ablaufen lassen.
  -- Sonst blieben nach einem zweiten SMS-Versand zwei gültige Links im Umlauf.
  update public.tokens
     set gueltig_bis = now()
   where anruf_id = p_anruf_id
     and verwendet_am is null
     and gueltig_bis > now();

  insert into public.tokens (anruf_id, betrieb_id, token_hash, gueltig_bis)
  values (p_anruf_id, v_anruf.betrieb_id, p_token_hash,
          now() + make_interval(hours => p_gueltig_stunden));

  return query select v_betrieb.telefon, v_betrieb.name;
end;
$$;


-- ---------------------------------------------------------------------------
-- Rechte: ausdrücklich NICHT für anon.
-- ---------------------------------------------------------------------------
revoke all on function public.bewertungslink_erzeugen(uuid, text, integer) from public;
grant execute on function public.bewertungslink_erzeugen(uuid, text, integer) to authenticated;


-- ---------------------------------------------------------------------------
-- Kontrollausgabe -- die neue Funktion muss bei "besucher" false zeigen.
-- ---------------------------------------------------------------------------
select
  p.proname                                        as funktion,
  has_function_privilege('anon', p.oid, 'EXECUTE')          as besucher,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as angemeldet
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('bewertung_daten', 'bewertung_speichern', 'bewertungslink_erzeugen')
order by p.proname;
