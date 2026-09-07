-- ============================================================================
-- 0005  Bewertung ohne Anmeldung
--
-- Die Bewertungsseite wird über einen SMS-Link geöffnet, ohne Anmeldung.
-- Für die Datenbank ist der Besucher damit "anon" - und anon hat auf keine
-- einzige Tabelle Zugriff. Das soll auch so bleiben.
--
-- Lösung: zwei Funktionen mit "security definer". Sie laufen mit erhöhten
-- Rechten, aber sie können nur genau das, was hier drinsteht. Ein Besucher
-- kann darüber weder fremde Anrufe lesen noch irgendetwas anderes schreiben.
--
-- Bewusst NICHT über den geheimen Serverschlüssel gelöst: Der würde sämtliche
-- Regeln aushebeln. Käme er je abhanden, stünde die ganze Datenbank offen.
-- Diese beiden Funktionen dagegen sind auch bei Missbrauch harmlos - ohne
-- gültigen Token tun sie nichts.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. Anzeigen: Was steht auf der Bewertungsseite?
--
-- Bekommt den HASH des Tokens, nie den Token selbst. Findet sich nichts,
-- kommt eine leere Antwort zurück - die Anwendung behandelt das als
-- "unbekannter Link".
-- ---------------------------------------------------------------------------
create or replace function public.bewertung_daten(p_token_hash text)
returns table (
  status           text,
  betrieb_name     text,
  anrufer_nummer   text,
  beginn           timestamptz,
  dauer_sekunden   integer,
  wert_klein_cent  bigint,
  wert_mittel_cent bigint,
  wert_gross_cent  bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    case
      when tk.verwendet_am is not null then 'bereits_bewertet'
      when tk.gueltig_bis < now()      then 'abgelaufen'
      else 'gueltig'
    end,
    b.name,
    a.anrufer_nummer,
    a.beginn,
    a.dauer_sekunden,
    b.wert_klein_cent,
    b.wert_mittel_cent,
    b.wert_gross_cent
  from public.tokens tk
  join public.anrufe   a on a.id = tk.anruf_id
  join public.betriebe b on b.id = tk.betrieb_id
  where tk.token_hash = p_token_hash
$$;


-- ---------------------------------------------------------------------------
-- 2. Speichern: die eigentliche Bewertung
--
-- Prüft den Token, rechnet die gewählte Stufe in einen Betrag um, legt die
-- Bewertung an und entwertet den Token - alles in einem Rutsch.
--
-- Der Euro-Betrag wird hier festgeschrieben. Ändert der Betrieb später seine
-- Wertstufen, bleibt diese Bewertung unverändert.
-- ---------------------------------------------------------------------------
create or replace function public.bewertung_speichern(
  p_token_hash text,
  p_ergebnis   text
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
begin
  if p_ergebnis not in ('kein_auftrag', 'klein', 'mittel', 'gross') then
    return 'ungueltige_eingabe';
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
-- Ausführungsrechte
--
-- Funktionen sind in Postgres standardmäßig für JEDEN ausführbar. Deshalb
-- erst entziehen, dann gezielt vergeben.
-- ---------------------------------------------------------------------------
revoke all on function public.bewertung_daten(text)            from public;
revoke all on function public.bewertung_speichern(text, text)  from public;

grant execute on function public.bewertung_daten(text)           to anon, authenticated;
grant execute on function public.bewertung_speichern(text, text) to anon, authenticated;


-- ---------------------------------------------------------------------------
-- Kontrollausgabe
-- ---------------------------------------------------------------------------
select
  p.proname                                          as funktion,
  p.prosecdef                                        as laeuft_mit_erhoehten_rechten,
  has_function_privilege('anon', p.oid, 'EXECUTE')   as besucher_darf_aufrufen,
  (select count(*) from unnest(array['public.tokens','public.anrufe','public.bewertungen']) t
     where has_table_privilege('anon', t, 'SELECT'))  as tabellen_fuer_besucher
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('bewertung_daten', 'bewertung_speichern')
order by p.proname;
