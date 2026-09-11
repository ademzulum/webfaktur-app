-- ============================================================================
-- Anmeldekonten für die Vorführung
--
-- Setzt voraus, dass demo-daten.sql schon gelaufen ist.
--
-- ES GIBT ZWEI WEGE. Der erste ist der bessere.
-- ============================================================================


-- ============================================================================
-- WEG 1 -- ÜBER DIE ANWENDUNG SELBST. Empfohlen.
--
-- Melde dich als Admin an und gehe auf
--   Betriebe -> Dachdeckerei Gruber -> Zugänge -> Neuen Zugang anlegen
--
-- Das Passwort wird erzeugt und einmalig angezeigt. Fertig.
--
-- WARUM DAS BESSER IST: Die Anwendung legt das Konto über die dafür
-- vorgesehene Schnittstelle von Supabase an. Die kümmert sich um ein gutes
-- Dutzend Felder, die beim Anmelden geprüft werden - Bestätigungszeitpunkt,
-- Anmeldeverfahren, Verknüpfungseintrag. Von Hand geschrieben stimmt davon
-- erfahrungsgemäß immer eines nicht, und der Fehler zeigt sich erst beim
-- Anmelden als "Invalid login credentials", ohne zu sagen, woran es liegt.
--
-- Nebenbei führt dieser Weg gleich vor, wie ein Kunde einen Zugang bekommt.
-- ============================================================================


-- ============================================================================
-- WEG 2 -- VON HAND. Nur, wenn Weg 1 nicht in Frage kommt.
--
-- Zwei Schritte:
--   a) Konto unter Authentication -> Users -> "Add user" anlegen.
--      Wichtig: "Auto Confirm User" einschalten, sonst ist keine Anmeldung
--      möglich.
--   b) Danach die Abfrage hier unten ausführen. Sie verbindet das Konto mit
--      einem Betrieb und der Rolle "betrieb".
--
-- Die E-Mail unten anpassen.
-- ============================================================================

insert into public.nutzer (id, betrieb_id, rolle, name)
select
  u.id,
  'e1000000-0000-4000-8000-000000000001',   -- Dachdeckerei Gruber
  'betrieb',
  'Demo Dachdeckerei'
from auth.users u
where u.email = 'HIER-DIE-EMAIL-DES-DEMOKONTOS'
on conflict (id) do update set
  betrieb_id = excluded.betrieb_id,
  rolle      = excluded.rolle,
  name       = excluded.name;


-- ---------------------------------------------------------------------------
-- Kontrolle: Wer ist jetzt wem zugeordnet?
--
-- Ein leeres Ergebnis bei einem Demokonto heißt, dass die E-Mail oben nicht
-- zu einem vorhandenen Konto passt.
-- ---------------------------------------------------------------------------
select
  u.email,
  n.rolle,
  coalesce(b.name, '— alle Betriebe —') as betrieb,
  case when u.email_confirmed_at is null
       then 'NICHT bestätigt, Anmeldung schlägt fehl'
       else 'bestätigt' end as zustand
from public.nutzer n
join auth.users u      on u.id = n.id
left join public.betriebe b on b.id = n.betrieb_id
order by n.rolle, u.email;
