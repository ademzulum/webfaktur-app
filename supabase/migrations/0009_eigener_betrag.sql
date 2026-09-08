-- ============================================================================
-- 0009  Eigener Betrag auf der Bewertungsseite
--
-- Bisher gab es vier Antworten: kein Auftrag, klein, mittel, groß. Die drei
-- Beträge stellt der Betrieb vorher ein. Für den Ausreißer - den Auftrag über
-- 40.000 Euro - passte keine davon.
--
-- Neu ist deshalb das Ergebnis 'eigen' mit einem selbst getippten Betrag.
--
-- WARUM DIE OBERGRENZE HIER STEHT UND NICHT IN DER ANWENDUNG:
-- Dieser Betrag geht später als Umsatz an Google Ads. Ein Vertipper - eine
-- Null zu viel - würde Google beibringen, auf die falschen Anzeigen zu
-- optimieren, und das Geld folgt dieser Fehleinschätzung. Die Grenze gehört
-- deshalb an die Stelle, an der niemand vorbeikommt. Ein Fehler in der
-- Anwendung, ein manipuliertes Formular oder ein späterer zweiter Weg in die
-- Datenbank können sie nicht umgehen.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Das neue Ergebnis erlauben
--
-- Die Prüfregel wurde in 0001 ohne Namen angelegt, Postgres hat sich selbst
-- einen ausgedacht. Deshalb wird sie hier gesucht statt geraten.
-- ---------------------------------------------------------------------------
do $$
declare
  v_name text;
begin
  select conname into v_name
    from pg_constraint
   where conrelid = 'public.bewertungen'::regclass
     and contype = 'c'
     and pg_get_constraintdef(oid) like '%ergebnis%';

  if v_name is not null then
    execute format('alter table public.bewertungen drop constraint %I', v_name);
  end if;
end $$;

alter table public.bewertungen
  add constraint bewertungen_ergebnis_erlaubt
  check (ergebnis in ('kein_auftrag', 'klein', 'mittel', 'gross', 'eigen'));


-- ---------------------------------------------------------------------------
-- 2. Speichern, jetzt mit eigenem Betrag
--
-- Die alte Fassung wird entfernt, nicht ergänzt: Zwei Funktionen gleichen
-- Namens, von denen eine den dritten Wert weglassen darf, wären für die
-- Schnittstelle nicht unterscheidbar - jeder Aufruf endete mit einem Fehler.
-- ---------------------------------------------------------------------------
drop function if exists public.bewertung_speichern(text, text);

create or replace function public.bewertung_speichern(
  p_token_hash text,
  p_ergebnis   text,
  p_wert_cent  bigint default null
)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_token   public.tokens;
  v_betrieb public.betriebe;
  v_wert    bigint;

  -- Eine Million Euro. Großzügig genug für jeden echten Auftrag und eng
  -- genug, dass ein Vertipper auffällt statt durchzurutschen.
  v_hoechstbetrag constant bigint := 100000000;
begin
  if p_ergebnis not in ('kein_auftrag', 'klein', 'mittel', 'gross', 'eigen') then
    return 'ungueltige_eingabe';
  end if;

  if p_ergebnis = 'eigen' then
    if p_wert_cent is null
       or p_wert_cent <= 0
       or p_wert_cent > v_hoechstbetrag then
      return 'ungueltiger_betrag';
    end if;
  end if;

  -- "for update" sperrt die Zeile. Tippt jemand zweimal schnell hintereinander,
  -- wartet der zweite Aufruf - und sieht dann, dass der Token entwertet ist.
  select * into v_token
    from public.tokens
   where token_hash = p_token_hash
     for update;

  if not found                        then return 'unbekannt';        end if;
  if v_token.verwendet_am is not null  then return 'bereits_bewertet'; end if;
  if v_token.gueltig_bis < now()       then return 'abgelaufen';       end if;

  select * into v_betrieb from public.betriebe where id = v_token.betrieb_id;
  if not found then return 'unbekannt'; end if;

  v_wert := case p_ergebnis
              when 'kein_auftrag' then 0
              when 'klein'        then v_betrieb.wert_klein_cent
              when 'mittel'       then v_betrieb.wert_mittel_cent
              when 'gross'        then v_betrieb.wert_gross_cent
              when 'eigen'        then p_wert_cent
            end;

  insert into public.bewertungen (anruf_id, betrieb_id, ergebnis, wert_cent)
  values (v_token.anruf_id, v_token.betrieb_id, p_ergebnis, v_wert);

  update public.tokens set verwendet_am = now() where id = v_token.id;

  return 'gespeichert';

exception
  -- Fängt den Fall ab, dass zu diesem Anruf schon eine Bewertung existiert.
  when unique_violation then
    return 'bereits_bewertet';
end;
$$;


-- ---------------------------------------------------------------------------
-- 3. Ausführungsrechte
--
-- Funktionen sind in Postgres standardmäßig für JEDEN ausführbar. Deshalb
-- erst entziehen, dann gezielt vergeben.
-- ---------------------------------------------------------------------------
revoke all on function public.bewertung_speichern(text, text, bigint) from public;
grant execute on function public.bewertung_speichern(text, text, bigint)
  to anon, authenticated;


-- ---------------------------------------------------------------------------
-- Kontrollausgabe: Es darf nur noch EINE Fassung geben, und "anon" muss sie
-- aufrufen dürfen.
-- ---------------------------------------------------------------------------
select
  p.proname                                        as funktion,
  pg_get_function_identity_arguments(p.oid)        as werte,
  has_function_privilege('anon', p.oid, 'EXECUTE') as besucher_darf_aufrufen
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'bewertung_speichern';
