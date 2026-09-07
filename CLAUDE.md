# webfaktur-app

## Was das ist
Eine PWA für Kunden einer kleinen Webagentur (webfaktur, Österreich).
Der Name kommt von der Agentur, NICHT von Rechnungen.
Es geht NICHT um Fakturierung, Buchhaltung oder Rechnungsstellung.

## Zweck
Handwerksbetriebe bekommen Anrufe über ihre Website. Ein Call-Tracking-
Anbieter (matelso) erfasst, über welche Google-Ads-Anzeige und welches
Keyword der Anrufer kam. Der Betrieb bewertet danach per SMS-Link mit
zwei Taps, ob daraus ein Auftrag wurde und was er ungefähr wert ist.
Dieser Wert geht als Conversion zurück an Google Ads, damit Google auf
Umsatz statt auf Klicks optimiert.

## Kernablauf
1. matelso schickt nach Gesprächsende einen Webhook an /api/webhooks/matelso
2. Anruf wird in Supabase gespeichert
3. Zwei Minuten später SMS an den Betrieb (Twilio) mit signiertem Einmal-Link
4. Bewertungsseite ohne Login, Token 48 Stunden gültig, vier Schaltflächen
5. Bewertung geht als Call Conversion an Google (Data Manager API)
6. Dashboard (PWA mit Login) zeigt Anrufe, Auswertungen, ROAS

## Stack
Next.js (App Router, TypeScript), Tailwind, shadcn/ui, Recharts
Supabase (Postgres, Auth, Row Level Security), Region Frankfurt
Vercel Hosting, Twilio SMS

## Nutzerrollen
- Admin (Agenturinhaber): sieht alle Betriebe, weist Pakete zu
- Betriebsnutzer: sieht ausschließlich Daten des eigenen Betriebs

## Datenmodell (geplant)
betriebe, nutzer, anrufe, bewertungen, tokens
Jede Zeile in anrufe und bewertungen gehört genau einem Betrieb.

## Nicht verhandelbar
- Mandantentrennung über Row Level Security in der Datenbank,
  nicht über Anwendungslogik
- Keine Schlüssel im Code, ausschließlich Umgebungsvariablen
- Twilio über API Key (SK…), nicht über den Auth Token
- Personenbezogene Daten (Anrufernummern, Standorte) bleiben in der EU
- Authentifizierung über Supabase Auth, nichts selbst gebaut

## Arbeitsweise
Der Betreiber hat keine Programmiererfahrung.
Ein Schritt pro Aufgabe, keine ungefragten Zusatzfunktionen.
Jede angelegte Datei kurz erklären.
Nach jedem funktionierenden Schritt committen.

<!-- Bindet die Next.js-16-Hinweise aus AGENTS.md ein (von "next dev" gepflegt). -->
@AGENTS.md
