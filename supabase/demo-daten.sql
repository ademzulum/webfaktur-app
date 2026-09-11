-- ============================================================================
-- Demodaten für eine Vorführung
--
-- Legt drei Betriebe mit Preisen, Verträgen und rund einem halben Jahr
-- Anrufen samt Bewertungen an. Damit sind alle Ansichten gefüllt: Übersicht,
-- Anrufliste, Kampagnenauswertung und Kostenübersicht mit Sechsmonatsverlauf.
--
-- Am Ende bekommst du fertige Bewertungslinks, mit denen sich die
-- Bewertungsseite am Telefon vorführen lässt - ohne SMS.
--
-- ACHTUNG: Diese Datei legt Daten DAUERHAFT an, anders als die Prüfdateien.
-- Wie du sie wieder loswirst, steht ganz unten.
--
-- Alles Angelegte trägt feste Kennungen und den Vorsatz "demo-". Echte Daten
-- werden dadurch nie mit angefasst.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 0. EINSTELLEN, BEVOR DU AUSFÜHRST
--
-- Willst du auch den SMS-Versand vorführen, trag unten bei allen drei
-- Betrieben deine eigene Mobilnummer ein (Format +43664...). Sonst lass die
-- Nummern stehen - sie sind erfunden, und es geht nichts hinaus.
-- ---------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
-- 1. Drei Betriebe
--
-- Bewusst verschiedene Wertstufen: So sieht man in der Auswertung sofort,
-- dass die Beträge je Betrieb gelten und nicht fest eingebaut sind.
-- ---------------------------------------------------------------------------
insert into public.betriebe
  (id, name, telefon, google_ads_kundennummer, paket, aktiv,
   wert_klein_cent, wert_mittel_cent, wert_gross_cent)
values
  ('e1000000-0000-4000-8000-000000000001',
   'Dachdeckerei Gruber', '+436640000001', '123-456-7890', 'premium', true,
    35000,  150000,  450000),
  ('e2000000-0000-4000-8000-000000000002',
   'Installateur Hofer',  '+436640000002', '234-567-8901', 'plus',    true,
    25000,  100000,  300000),
  ('e3000000-0000-4000-8000-000000000003',
   'Elektro Baumgartner', '+436640000003', '345-678-9012', 'basis',   true,
    18000,   70000,  200000)
on conflict (id) do update set
  name    = excluded.name,
  telefon = excluded.telefon,
  paket   = excluded.paket;


-- ---------------------------------------------------------------------------
-- 2. Preise und Verträge
--
-- Der dritte Betrieb ist bewusst knapp kalkuliert - so ist in der
-- Kostenübersicht auch eine schwache Marge zu sehen und nicht nur drei
-- erfreuliche Zeilen.
-- ---------------------------------------------------------------------------
insert into public.preiskonfiguration
  (betrieb_id, paket, verkaufspreis_monatlich_cent,
   matelso_kosten_geschaetzt_monatlich_cent, vertragsbeginn,
   mindestlaufzeit_monate)
values
  ('e1000000-0000-4000-8000-000000000001', 'premium',
   79900, 19000, current_date - interval '14 months', 12),
  ('e2000000-0000-4000-8000-000000000002', 'plus',
   49900, 14000, current_date - interval '5 months',  12),
  ('e3000000-0000-4000-8000-000000000003', 'basis',
   19900, 14000, current_date - interval '2 months',  24)
on conflict (betrieb_id) do update set
  paket                                    = excluded.paket,
  verkaufspreis_monatlich_cent             = excluded.verkaufspreis_monatlich_cent,
  matelso_kosten_geschaetzt_monatlich_cent = excluded.matelso_kosten_geschaetzt_monatlich_cent,
  vertragsbeginn                           = excluded.vertragsbeginn,
  mindestlaufzeit_monate                   = excluded.mindestlaufzeit_monate;


-- ---------------------------------------------------------------------------
-- 3. Zahlungsstatus der letzten drei Monate
--
-- Der laufende Monat bleibt bei zwei Betrieben offen - sonst hätte man in
-- der Kostenübersicht keinen Schalter zum Vorführen.
-- ---------------------------------------------------------------------------
insert into public.zahlungen (betrieb_id, monat, status, bezahlt_am)
select
  b.id,
  (date_trunc('month', current_date) - (m || ' months')::interval)::date,
  case when m = 0 and b.id <> 'e1000000-0000-4000-8000-000000000001'
       then 'offen' else 'bezahlt' end,
  case when m = 0 and b.id <> 'e1000000-0000-4000-8000-000000000001'
       then null else now() end
from public.betriebe b
cross join generate_series(0, 2) m
where b.id in ('e1000000-0000-4000-8000-000000000001',
               'e2000000-0000-4000-8000-000000000002',
               'e3000000-0000-4000-8000-000000000003')
on conflict (betrieb_id, monat) do update set status = excluded.status;


-- ---------------------------------------------------------------------------
-- 4. Anrufe über sechs Monate
--
-- Die Anzahl steigt zum Gegenwärtigen hin leicht an - das macht den
-- Sechsmonatsverlauf in der Kostenübersicht erst aussagekräftig. Eine
-- gleichmäßige Verteilung sähe aus wie ein Lineal.
--
-- "matelso_id" trägt den Vorsatz "demo-". Daran und nur daran erkennt die
-- Aufräumanweisung ganz unten, was sie löschen darf.
-- ---------------------------------------------------------------------------
insert into public.anrufe
  (betrieb_id, matelso_id, anrufer_nummer, angerufene_nummer, beginn,
   dauer_sekunden, kampagne, anzeigengruppe, keyword, gclid)
select
  q.betrieb_id,
  'demo-' || q.kuerzel || '-' || q.nr,
  '+43664' || lpad(((random() * 8999999)::int + 1000000)::text, 7, '0'),
  q.telefon,
  q.zeitpunkt,
  -- Etwa jeder achte Anruf ist ein Fehlanruf unter 20 Sekunden. Ohne die
  -- sähe die Dauerverteilung unnatürlich sauber aus.
  case when random() < 0.12 then (5 + random() * 15)::int
       else (45 + random() * 400)::int end,
  q.kampagne,
  q.anzeigengruppe,
  q.keyword,
  'demo-gclid-' || md5(random()::text)
from (
  select
    b.id as betrieb_id,
    b.telefon,
    b.kuerzel,
    g.nr,
    -- Je weiter zurück, desto weniger Anrufe: Der Zufallswert wird mit sich
    -- selbst multipliziert, dadurch häufen sich die Werte nahe null - also
    -- nahe heute.
    (now()
      - ((random() * random() * 180)::int || ' days')::interval
      - ((random() * 86400)::int || ' seconds')::interval) as zeitpunkt,
    k.kampagne,
    k.anzeigengruppe,
    k.keyword
  from (
    values
      ('e1000000-0000-4000-8000-000000000001'::uuid, '+436640000001', 'a', 90),
      ('e2000000-0000-4000-8000-000000000002'::uuid, '+436640000002', 'b', 55),
      ('e3000000-0000-4000-8000-000000000003'::uuid, '+436640000003', 'c', 32)
  ) as b(id, telefon, kuerzel, anzahl)
  cross join lateral generate_series(1, b.anzahl) as g(nr)
  cross join lateral (
    select kampagne, anzeigengruppe, keyword
    from (
      values
        ('Dachsanierung Wien',   'Sanierung',  'dachdecker wien',        1),
        ('Dachsanierung Wien',   'Sanierung',  'dach neu decken kosten', 1),
        ('Sturmschaden Notdienst','Notdienst', 'dach notdienst',         1),
        ('Bad sanieren Graz',    'Sanierung',  'installateur graz',      2),
        ('Bad sanieren Graz',    'Sanierung',  'bad umbau preis',        2),
        ('Rohrbruch Notdienst',  'Notdienst',  'rohrbruch notdienst',    2),
        ('Elektro Altbau Linz',  'Altbau',     'elektriker linz',        3),
        ('Elektro Altbau Linz',  'Altbau',     'sicherungskasten tausch',3),
        ('E-Ladestation',        'Wallbox',    'wallbox installieren',   3)
    ) as alle(kampagne, anzeigengruppe, keyword, zuordnung)
    where alle.zuordnung = case b.kuerzel when 'a' then 1 when 'b' then 2 else 3 end
    order by random()
    limit 1
  ) as k
) as q
on conflict (matelso_id) do nothing;


-- ---------------------------------------------------------------------------
-- 5. Bewertungen
--
-- Nicht alles wird bewertet - etwa 28 Prozent bleiben offen, so wie in der
-- Wirklichkeit. Und Anrufe der letzten zwei Tage bleiben grundsätzlich
-- offen: Die sollen in der Liste als "noch nicht bewertet" zu sehen sein.
--
-- Sehr kurze Anrufe werden nie zu einem Auftrag. Das ist kein Zufall,
-- sondern in der Verteilung unten so gebaut.
-- ---------------------------------------------------------------------------
insert into public.bewertungen (anruf_id, betrieb_id, ergebnis, wert_cent, bewertet_am)
select
  a.id,
  a.betrieb_id,
  w.ergebnis,
  case w.ergebnis
    when 'kein_auftrag' then 0
    when 'klein'  then b.wert_klein_cent
    when 'mittel' then b.wert_mittel_cent
    when 'gross'  then b.wert_gross_cent
    -- Der selbst getippte Ausreißer: 15.000 bis 60.000 Euro.
    when 'eigen'  then ((1500 + (random() * 4500)::int) * 1000)::bigint
  end,
  a.beginn + ((20 + random() * 1200)::int || ' minutes')::interval
from public.anrufe a
join public.betriebe b on b.id = a.betrieb_id
cross join lateral (
  select case
    -- Unter 25 Sekunden: so gut wie immer kein Auftrag.
    when a.dauer_sekunden < 25 then 'kein_auftrag'
    when random() < 0.34 then 'kein_auftrag'
    when random() < 0.55 then 'klein'
    when random() < 0.75 then 'mittel'
    when random() < 0.95 then 'gross'
    else 'eigen'
  end as ergebnis
) as w
where a.matelso_id like 'demo-%'
  and a.beginn < now() - interval '2 days'
  and random() < 0.72
on conflict (anruf_id) do nothing;


-- ---------------------------------------------------------------------------
-- 6. Bewertungslinks zum Vorführen
--
-- Für jeden Betrieb ein noch offener Anruf mit einem echten Link - gleiche
-- Machart wie der, der später per SMS hinausgeht: In der Datenbank steht
-- ausschließlich der Hash, der Link selbst existiert nur hier einmal.
--
-- Deshalb muss er JETZT notiert werden. Später lässt er sich nicht mehr
-- ermitteln, auch nicht mit vollem Datenbankzugriff. Genau das ist der Sinn.
-- ---------------------------------------------------------------------------
create temporary table demo_links (
  betrieb  text,
  anruf_id uuid,
  betrieb_id uuid,
  token    text
);

insert into demo_links (betrieb, anruf_id, betrieb_id, token)
select
  b.name,
  a.id,
  a.betrieb_id,
  -- Zwei zufällige Kennungen aneinander, Bindestriche entfernt: 64 Zeichen,
  -- die in einer Adresse stehen dürfen. Dieselbe Wirkung wie der Zufallswert,
  -- den die Anwendung erzeugt, nur ohne zusätzliche Erweiterung.
  replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
from (
  select distinct on (a.betrieb_id) a.id, a.betrieb_id, a.beginn
  from public.anrufe a
  left join public.bewertungen bw on bw.anruf_id = a.id
  left join public.tokens tk      on tk.anruf_id = a.id
  where a.matelso_id like 'demo-%'
    and bw.id is null
    and tk.id is null
  order by a.betrieb_id, a.beginn desc
) a
join public.betriebe b on b.id = a.betrieb_id;

insert into public.tokens (anruf_id, betrieb_id, token_hash, gueltig_bis)
select
  d.anruf_id,
  d.betrieb_id,
  -- Muss genau so gerechnet werden wie in lib/token.ts, sonst findet die
  -- Bewertungsseite den Link nicht wieder.
  encode(sha256(convert_to(d.token, 'UTF8')), 'hex'),
  now() + interval '48 hours'
from demo_links d;


-- ---------------------------------------------------------------------------
-- 7. Das Ergebnis
--
-- Die Adresse vorne anpassen: örtlich http://localhost:3000,
-- live die eigene Vercel-Adresse.
-- ---------------------------------------------------------------------------
select
  d.betrieb,
  'http://localhost:3000/bewerten/' || d.token as bewertungslink,
  'gültig bis ' || to_char(now() + interval '48 hours', 'DD.MM.YYYY HH24:MI') as gueltigkeit
from demo_links d
order by d.betrieb;


-- ============================================================================
-- SO WIRST DU ALLES WIEDER LOS
--
-- Die drei Anweisungen einzeln ausführen, von oben nach unten. Anrufe,
-- Bewertungen, Links, Preise und Zahlungen hängen an den Betrieben und
-- verschwinden mit ihnen von selbst.
--
--   delete from public.anrufe   where matelso_id like 'demo-%';
--   delete from public.betriebe where id in (
--     'e1000000-0000-4000-8000-000000000001',
--     'e2000000-0000-4000-8000-000000000002',
--     'e3000000-0000-4000-8000-000000000003');
--
-- Anmeldekonten verschwinden dabei NICHT. Die stehen in der Kontenverwaltung
-- von Supabase unter Authentication -> Users und müssen dort entfernt werden.
-- ============================================================================
