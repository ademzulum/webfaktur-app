-- ============================================================================
-- 0011  Nächste mögliche Kündigung
--
-- Die Regel, wie sie gilt:
--   - Nach der Mindestlaufzeit verlängert sich der Vertrag MONATLICH.
--   - Gekündigt werden muss VOR Beginn des nächsten Abrechnungszeitraums.
--
-- Daraus folgt: Der Vertrag endet immer an einem Monatsstichtag, und zwar am
-- nächsten, der noch in der Zukunft liegt und nicht vor dem Ende der
-- Mindestlaufzeit.
--
-- Die Stichtage hängen am Vertragsbeginn, nicht am Kalendermonat. Beginnt
-- ein Vertrag am 15., laufen die Zeiträume vom 15. bis zum 15. Das ist
-- wichtig: Am 20. gekündigt heißt Ende am 15. des Folgemonats, nicht am
-- Monatsersten.
--
-- Beispiel: Beginn 01.03.2025, Mindestlaufzeit 12 Monate.
--   Mindestlaufzeit endet 01.03.2026. Ist die vorbei, ist der nächste
--   Stichtag der kommende Monatserste - dann muss die Kündigung vorher da
--   sein.
--
-- Der Rückgabetyp ändert sich, deshalb muss die Funktion erst weg. "create
-- or replace" allein kann keine Spalte hinzufügen.
-- ============================================================================

drop function if exists public.kostenuebersicht(date);

create or replace function public.kostenuebersicht(p_monat date default null)
returns table (
  betrieb_id                    uuid,
  betrieb_name                  text,
  paket                         text,
  verkaufspreis_cent            bigint,
  matelso_kosten_cent           bigint,
  anrufe_gesamt                 bigint,
  bewertete_anrufe              bigint,
  sms_kosten_cent               bigint,
  marge_cent                    bigint,
  marge_prozent                 numeric,
  deckungsbeitrag_je_anruf_cent bigint,
  zahlungsstatus                text,
  vertragsbeginn                date,
  mindestlaufzeit_monate        integer,
  mindestlaufzeit_bis           date,
  naechste_kuendigung           date
)
language sql
stable
security invoker
set search_path = ''
as $$
  with zeitraum as (
    select
      coalesce(p_monat, date_trunc('month', now())::date) as anfang,
      (coalesce(p_monat, date_trunc('month', now())::date)
         + interval '1 month')::date as ende
  ),
  je_betrieb as (
    select
      pk.betrieb_id,
      count(a.id)  as anrufe_gesamt,
      count(bw.id) as bewertete_anrufe
    from public.preiskonfiguration pk
    cross join zeitraum zr
    left join public.anrufe a
      on  a.betrieb_id = pk.betrieb_id
      and a.beginn >= zr.anfang
      and a.beginn <  zr.ende
    left join public.bewertungen bw on bw.anruf_id = a.id
    group by pk.betrieb_id
  ),
  gerechnet as (
    select
      pk.betrieb_id,
      b.name  as betrieb_name,
      pk.paket,
      pk.verkaufspreis_monatlich_cent              as verkaufspreis_cent,
      pk.matelso_kosten_geschaetzt_monatlich_cent  as matelso_kosten_cent,
      jb.anrufe_gesamt,
      jb.bewertete_anrufe,
      (jb.bewertete_anrufe * public.sms_preis_cent())::bigint as sms_kosten_cent,
      pk.vertragsbeginn,
      pk.mindestlaufzeit_monate,
      zr.anfang as monatsanfang,

      -- Ende der Mindestlaufzeit
      case
        when pk.vertragsbeginn is null then null
        else (pk.vertragsbeginn
              + (pk.mindestlaufzeit_monate * interval '1 month'))::date
      end as mindestlaufzeit_bis,

      -- Der nächste Stichtag, der noch bevorsteht.
      --
      -- "age" liefert den Abstand zum Vertragsbeginn als Jahre/Monate/Tage.
      -- Jahre mal zwölf plus Monate ergibt die VOLL verstrichenen Monate;
      -- eins dazu ergibt den nächsten Stichtag. Liegt der Vertragsbeginn
      -- selbst noch in der Zukunft, wird die Zahl negativ - das fängt das
      -- "greatest" weiter unten ab.
      case
        when pk.vertragsbeginn is null then null
        else (pk.vertragsbeginn + ((
                (extract(year  from age(current_date, pk.vertragsbeginn))::int * 12)
              +  extract(month from age(current_date, pk.vertragsbeginn))::int
              + 1
             ) * interval '1 month'))::date
      end as naechster_stichtag
    from public.preiskonfiguration pk
    join public.betriebe b on b.id = pk.betrieb_id
    join je_betrieb jb     on jb.betrieb_id = pk.betrieb_id
    cross join zeitraum zr
  )
  select
    g.betrieb_id,
    g.betrieb_name,
    g.paket,
    g.verkaufspreis_cent,
    g.matelso_kosten_cent,
    g.anrufe_gesamt,
    g.bewertete_anrufe,
    g.sms_kosten_cent,
    (g.verkaufspreis_cent - g.matelso_kosten_cent - g.sms_kosten_cent)::bigint,
    case
      when g.verkaufspreis_cent = 0 then null
      else round(
        (g.verkaufspreis_cent - g.matelso_kosten_cent - g.sms_kosten_cent)::numeric
        * 100 / g.verkaufspreis_cent, 1)
    end,
    -- Ohne bewertete Anrufe gibt es keinen Deckungsbeitrag JE Anruf. Hier
    -- eine 0 zu liefern wäre falsch: 0 hieße "trägt nichts bei", richtig
    -- ist "lässt sich nicht sagen".
    case
      when g.bewertete_anrufe = 0 then null
      else ((g.verkaufspreis_cent - g.matelso_kosten_cent - g.sms_kosten_cent)
            / g.bewertete_anrufe)::bigint
    end,
    coalesce(zg.status, 'offen'),
    g.vertragsbeginn,
    g.mindestlaufzeit_monate,
    g.mindestlaufzeit_bis,

    -- Solange die Mindestlaufzeit läuft, ist deren Ende der früheste
    -- Termin. Danach zählt der nächste Monatsstichtag. "greatest" wählt
    -- immer den späteren der beiden - und das ist genau der richtige.
    case
      when g.vertragsbeginn is null then null
      else greatest(g.mindestlaufzeit_bis, g.naechster_stichtag)
    end
  from gerechnet g
  left join public.zahlungen zg
    on zg.betrieb_id = g.betrieb_id
   and zg.monat = g.monatsanfang
  order by g.betrieb_name
$$;

revoke all on function public.kostenuebersicht(date) from public, anon;
grant execute on function public.kostenuebersicht(date) to authenticated;


-- ---------------------------------------------------------------------------
-- Kontrolle der Kündigungsrechnung, ohne Daten anzulegen
--
-- Erwartung, gerechnet ab heute:
--   Beginn 01.03.2025, 12 Monate  -> Mindestlaufzeit vorbei,
--                                    nächster Monatserster
--   Beginn 15.09.2025, 24 Monate  -> 15.09.2027 (Mindestlaufzeit laeuft)
--   Beginn 15.09.2025, 1 Monat    -> naechster 15., nicht Monatserster
-- ---------------------------------------------------------------------------
with beispiele(beginn, monate) as (
  values (date '2025-03-01', 12),
         (date '2025-09-15', 24),
         (date '2025-09-15',  1)
)
select
  beginn,
  monate as mindestlaufzeit_monate,
  (beginn + (monate * interval '1 month'))::date as mindestlaufzeit_bis,
  greatest(
    (beginn + (monate * interval '1 month'))::date,
    (beginn + ((
        (extract(year  from age(current_date, beginn))::int * 12)
      +  extract(month from age(current_date, beginn))::int
      + 1
     ) * interval '1 month'))::date
  ) as naechste_kuendigung
from beispiele;
