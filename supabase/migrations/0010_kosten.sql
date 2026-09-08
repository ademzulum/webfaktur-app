-- ============================================================================
-- 0010  Kostenübersicht -- ausschließlich für den Agenturinhaber
--
-- Hier stehen Verkaufspreise, Einkaufskosten und damit die Marge. Das sind
-- die einzigen Daten in diesem Projekt, die ein Betrieb NIEMALS sehen darf -
-- auch nicht die eigene Zeile. Ein Kunde, der seine eigene Marge kennt,
-- verhandelt am nächsten Tag darüber.
--
-- Das ist ein anderer Schutz als bei den Anrufen. Dort gilt: "jeder sieht
-- seine eigenen Zeilen". Hier gilt: "nur der Admin sieht überhaupt etwas".
--
-- Wie überall in diesem Projekt macht das die Datenbank, nicht die
-- Anwendung. Zwei Schichten liegen davor, und beide müssen zustimmen:
--
--   1. GRANT  -- darf diese Rolle die Tabelle überhaupt anfassen?
--   2. RLS    -- und wenn ja, welche Zeilen?
--
-- Geprüft wird das mit supabase/kostenschutz-pruefen.sql. Solange diese
-- Prüfung nicht durchläuft, gehört keine Oberfläche darauf gebaut.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. Preise und Vertrag je Betrieb
--
-- Bewusst eine eigene Tabelle statt zusätzlicher Spalten in "betriebe":
-- Auf "betriebe" darf ein Betriebsnutzer lesen, er braucht ja seinen eigenen
-- Namen und seine Wertstufen. Stünden die Preise in derselben Tabelle,
-- müsste man Zugriff SPALTENWEISE einschränken. Das ist in Postgres
-- möglich, aber leicht falsch zu machen, und ein Fehler fiele niemandem auf.
-- Eine eigene Tabelle ist entweder ganz sichtbar oder gar nicht.
-- ---------------------------------------------------------------------------
create table if not exists public.preiskonfiguration (
  betrieb_id uuid primary key
               references public.betriebe(id) on delete cascade,

  -- Doppelt zum Paket in "betriebe" gehalten. Absicht: Dort ist es die
  -- Leistungsstufe, die der Betrieb sieht. Hier ist es der Tarif, zu dem
  -- verkauft wurde. Ändert sich der eine, muss sich der andere nicht ändern.
  paket text not null default 'basis',

  -- Alles in Cent, damit keine Rundungsfehler entstehen (49,00 EUR = 4900).
  verkaufspreis_monatlich_cent bigint not null default 0
    check (verkaufspreis_monatlich_cent >= 0),

  -- GESCHÄTZT. Es gibt derzeit keinen Vertrag mit matelso. Der Name der
  -- Spalte sagt das ausdrücklich, damit niemand die Zahl später für belegt
  -- hält, nur weil sie in einer Datenbank steht.
  matelso_kosten_geschaetzt_monatlich_cent bigint not null default 0
    check (matelso_kosten_geschaetzt_monatlich_cent >= 0),

  vertragsbeginn        date,
  mindestlaufzeit_monate integer not null default 12
    check (mindestlaufzeit_monate >= 0),

  angelegt_am   timestamptz not null default now(),
  geaendert_am  timestamptz not null default now()
);


-- ---------------------------------------------------------------------------
-- 2. Zahlungsstatus je Betrieb und Monat
--
-- Bewusst KEINE Rechnungslogik: kein Betrag, keine Rechnungsnummer, kein
-- Fälligkeitsdatum. Nur "offen" oder "bezahlt". Alles Weitere macht später
-- ein Buchhaltungsprogramm, und halbe Buchhaltung in zwei Systemen ist
-- schlimmer als gar keine.
--
-- "monat" ist immer der ERSTE des Monats. Die Prüfregel erzwingt das - sonst
-- lägen für denselben Monat zwei Zeilen vor, je nachdem, welchen Tag jemand
-- eingetragen hat.
-- ---------------------------------------------------------------------------
create table if not exists public.zahlungen (
  betrieb_id uuid not null
               references public.betriebe(id) on delete cascade,
  monat      date not null check (monat = date_trunc('month', monat)::date),

  status text not null default 'offen'
    check (status in ('offen', 'bezahlt')),

  bezahlt_am   timestamptz,
  angelegt_am  timestamptz not null default now(),

  primary key (betrieb_id, monat)
);


-- ---------------------------------------------------------------------------
-- 3. Was eine SMS kostet
--
-- Zentral, nicht je Betrieb: Der Preis kommt von Bird und ist für alle
-- gleich. Stünde er je Betrieb, müsste man ihn an zwanzig Stellen ändern und
-- neunzehn davon vergessen.
--
-- Bewusst eine Funktion und keine Tabelle: Eine Tabelle bräuchte eigene
-- Zugriffsregeln, und eine falsch gesetzte Regel auf einer Ein-Zeilen-
-- Tabelle wäre viel Aufwand für eine Zahl. Ändert sich der Preis, ändert
-- sich diese eine Zeile in einer neuen Migration.
--
-- ZUM AUFRUFRECHT, weil es auf den ersten Blick zu großzügig aussieht:
-- Die Auswertung weiter unten läuft mit den Rechten des Aufrufers - nur so
-- greifen die Zugriffsregeln. Sie muss diese Funktion also aufrufen dürfen,
-- und damit darf es jeder Angemeldete.
--
-- Preisgegeben ist damit genau eine Zahl: was eine SMS im Einkauf kostet.
-- Sie sagt nichts über einen Betrieb aus. Für die Marge braucht es
-- zusätzlich Verkaufspreis und matelso-Kosten, und die stehen in der
-- Tabelle oben, hinter den Zugriffsregeln.
--
-- Soll auch diese Zahl verschlossen sein, gehört sie in eine eigene Tabelle
-- mit denselben Regeln. Das ist machbar, kostet aber eine Tabelle samt vier
-- Regeln für einen einzigen Wert.
-- ---------------------------------------------------------------------------
create or replace function public.sms_preis_cent()
returns integer
language sql
immutable
set search_path = ''
as $$ select 9 $$;

revoke all on function public.sms_preis_cent() from public, anon;
grant execute on function public.sms_preis_cent() to authenticated;


-- ---------------------------------------------------------------------------
-- 4. Zugriffsregeln einschalten
--
-- Ohne diese Zeilen wäre jede Regel darunter wirkungslos. Supabase schaltet
-- sie bei neuen Tabellen von sich aus ein - hier steht es trotzdem
-- ausdrücklich, damit es nicht von einer Voreinstellung abhängt, die sich
-- irgendwann ändern kann.
-- ---------------------------------------------------------------------------
alter table public.preiskonfiguration enable row level security;
alter table public.zahlungen          enable row level security;

-- Gilt zusätzlich auch für den Tabelleneigentümer. Ohne das könnte ein
-- Zugriff unter der Eigentümerrolle an den Regeln vorbei.
alter table public.preiskonfiguration force row level security;
alter table public.zahlungen          force row level security;


-- ---------------------------------------------------------------------------
-- 5. Die Regeln
--
-- "public.ist_admin()" schlägt in der nutzer-Tabelle nach, ob das angemeldete
-- Konto die Rolle "admin" hat. Es steht schon in 0001 und läuft mit erhöhten
-- Rechten, weil es sonst beim Lesen der nutzer-Tabelle wieder auf seine
-- eigene Regel stieße - eine Schleife ohne Ende.
--
-- Bewusst KEINE Regel für "betrieb_id = public.mein_betrieb_id()". Genau
-- diese Zeile wäre der Fehler: Sie klingt vernünftig, gibt einem Betrieb
-- aber seine eigene Marge.
--
-- Vier getrennte Regeln statt einer für alles: So steht bei jeder Zugriffsart
-- ausdrücklich da, wer sie darf. Eine vergessene Art fällt dadurch auf,
-- statt stillschweigend erlaubt zu sein.
-- ---------------------------------------------------------------------------
drop policy if exists preise_lesen    on public.preiskonfiguration;
drop policy if exists preise_anlegen  on public.preiskonfiguration;
drop policy if exists preise_aendern  on public.preiskonfiguration;
drop policy if exists preise_loeschen on public.preiskonfiguration;

create policy preise_lesen on public.preiskonfiguration
  for select to authenticated
  using (public.ist_admin());

create policy preise_anlegen on public.preiskonfiguration
  for insert to authenticated
  with check (public.ist_admin());

create policy preise_aendern on public.preiskonfiguration
  for update to authenticated
  using (public.ist_admin())
  with check (public.ist_admin());

create policy preise_loeschen on public.preiskonfiguration
  for delete to authenticated
  using (public.ist_admin());


drop policy if exists zahlungen_lesen    on public.zahlungen;
drop policy if exists zahlungen_anlegen  on public.zahlungen;
drop policy if exists zahlungen_aendern  on public.zahlungen;
drop policy if exists zahlungen_loeschen on public.zahlungen;

create policy zahlungen_lesen on public.zahlungen
  for select to authenticated
  using (public.ist_admin());

create policy zahlungen_anlegen on public.zahlungen
  for insert to authenticated
  with check (public.ist_admin());

create policy zahlungen_aendern on public.zahlungen
  for update to authenticated
  using (public.ist_admin())
  with check (public.ist_admin());

create policy zahlungen_loeschen on public.zahlungen
  for delete to authenticated
  using (public.ist_admin());


-- ---------------------------------------------------------------------------
-- 6. Tabellenrechte
--
-- Die zweite Schicht. Postgres prüft sie VOR den Regeln oben: Wer hier nicht
-- steht, kommt gar nicht erst so weit, dass eine Regel ihn ablehnen könnte.
--
-- "anon" - der nicht angemeldete Besucher der Bewertungsseite - bekommt
-- nichts. Er hat mit Preisen nichts zu tun.
-- ---------------------------------------------------------------------------
revoke all on public.preiskonfiguration from anon, authenticated;
revoke all on public.zahlungen          from anon, authenticated;

grant select, insert, update, delete on public.preiskonfiguration to authenticated;
grant select, insert, update, delete on public.zahlungen          to authenticated;


-- ---------------------------------------------------------------------------
-- 7. Die Auswertung für einen Monat
--
-- Bewusst "security invoker": Die Funktion läuft mit den Rechten dessen, der
-- sie aufruft. Damit greifen die Regeln von oben unverändert weiter.
--
-- Und bewusst OHNE zusätzliche Prüfung "if not ist_admin() then ...":
-- Stünde die hier, übernähme sie den Schutz - und die Prüfung könnte nicht
-- mehr belegen, dass die Zugriffsregeln allein genügen. Ein Fehler in den
-- Regeln bliebe unentdeckt, weil ihn nichts mehr sichtbar macht. Die
-- Datenbank soll schützen, nicht diese Funktion.
--
-- Der Kniff: "preiskonfiguration" ist die FÜHRENDE Tabelle, alles andere
-- hängt daran. Wer dort keine Zeile sieht, bekommt auch keine Anrufzahlen -
-- obwohl er seine eigenen Anrufe sonst sehr wohl sehen darf.
--
-- Gezählt wird nach dem MONAT DES ANRUFS, nicht dem der Bewertung: Die SMS
-- geht unmittelbar nach dem Gespräch hinaus, die Kosten fallen also in
-- dessen Monat - auch wenn erst am Ersten des nächsten bewertet wird.
-- ---------------------------------------------------------------------------
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
  fruehestes_vertragsende       date
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
      zr.anfang as monatsanfang
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
    case
      when g.vertragsbeginn is null then null
      else (g.vertragsbeginn
            + (g.mindestlaufzeit_monate * interval '1 month'))::date
    end
  from gerechnet g
  left join public.zahlungen zg
    on zg.betrieb_id = g.betrieb_id
   and zg.monat = g.monatsanfang
  order by g.betrieb_name
$$;


-- ---------------------------------------------------------------------------
-- 8. Der Verlauf der letzten Monate
--
-- Keine neue Tabelle: Anrufe und Bewertungen liegen mit Datum vor, daraus
-- lässt sich jeder vergangene Monat neu ausrechnen. Eine Tabelle mit
-- monatlichen Zwischenständen wäre eine zweite Wahrheit, die irgendwann von
-- der ersten abweicht.
--
-- Der Verkaufspreis wird dabei mit dem HEUTIGEN Wert gerechnet, auch für
-- vergangene Monate - eine Preisänderung wird nicht mitgeschrieben. Für
-- einen Verlauf, der Preisänderungen kennt, bräuchte es eine Preishistorie.
-- ---------------------------------------------------------------------------
create or replace function public.kostenverlauf(p_monate integer default 6)
returns table (
  betrieb_id       uuid,
  monat            date,
  anrufe_gesamt    bigint,
  bewertete_anrufe bigint,
  marge_cent       bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with monate as (
    select generate_series(
      date_trunc('month', now())::date
        - ((greatest(coalesce(p_monate, 6), 1) - 1) * interval '1 month'),
      date_trunc('month', now())::date,
      interval '1 month'
    )::date as monat
  )
  select
    pk.betrieb_id,
    m.monat,
    count(a.id),
    count(bw.id),
    (pk.verkaufspreis_monatlich_cent
     - pk.matelso_kosten_geschaetzt_monatlich_cent
     - count(bw.id) * public.sms_preis_cent())::bigint
  from public.preiskonfiguration pk
  cross join monate m
  left join public.anrufe a
    on  a.betrieb_id = pk.betrieb_id
    and a.beginn >= m.monat
    and a.beginn <  (m.monat + interval '1 month')
  left join public.bewertungen bw on bw.anruf_id = a.id
  group by
    pk.betrieb_id,
    m.monat,
    pk.verkaufspreis_monatlich_cent,
    pk.matelso_kosten_geschaetzt_monatlich_cent
  order by pk.betrieb_id, m.monat
$$;


-- ---------------------------------------------------------------------------
-- 9. Aufrufrechte
--
-- Funktionen sind in Postgres standardmäßig für JEDEN ausführbar. Deshalb
-- erst entziehen, dann gezielt vergeben. "anon" bekommt nichts.
--
-- Dass jeder Angemeldete sie AUFRUFEN darf, ist kein Widerspruch: Sie
-- laufen mit seinen Rechten, und ohne Zeile in preiskonfiguration bekommt
-- er eine leere Antwort. Genau das prüft kostenschutz-pruefen.sql.
-- ---------------------------------------------------------------------------
revoke all on function public.kostenuebersicht(date)   from public, anon;
revoke all on function public.kostenverlauf(integer)   from public, anon;

grant execute on function public.kostenuebersicht(date) to authenticated;
grant execute on function public.kostenverlauf(integer) to authenticated;
