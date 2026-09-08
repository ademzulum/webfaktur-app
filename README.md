# webfaktur-app

Anrufe aus Google Ads bewerten und als Auftragswert an Google zurückmelden.
Was die Anwendung tut und warum, steht in [CLAUDE.md](CLAUDE.md).

## Örtlich starten

```bash
npm install
npm run dev
```

Läuft dann auf http://localhost:3000

Vorher `.env.local` anlegen. Als Vorlage dient [.env.example](.env.example) —
dort steht bei jedem Wert, wo er zu finden ist.

## Datenbank

Die Dateien in `supabase/migrations/` bauen die Datenbank auf. Sie werden im
SQL-Editor von Supabase **der Reihe nach** ausgeführt, von 0001 aufwärts. Jede
baut auf der vorigen auf, deshalb ist die Reihenfolge nicht beliebig.

Am Ende jeder Datei steht eine Kontrollabfrage. Zeigt sie nicht das, was
darüber beschrieben ist, sollte man nicht weitermachen.

Daneben liegen zwei Hilfsdateien, die nicht zum Aufbau gehören:

| Datei | Wofür |
|---|---|
| `admin-anlegen.sql` | Den ersten Zugang anlegen. Danach geht es in der Anwendung. |
| `mandantentrennung-pruefen.sql` | Nachweisen, dass kein Betrieb die Daten eines anderen sieht. Nach jeder Änderung am Datenmodell erneut ausführen. |
| `testdaten-entfernen.sql` | Alle Testanrufe löschen. Nicht mehr benutzen, sobald echte Anrufe erfasst sind. |

## Befehle

```bash
npm run dev     # Entwicklungsserver
npm run build   # bauen, wie es Vercel tut
npm run lint    # auf Fehler prüfen
```

```bash
node scripts/logos-erzeugen.mjs   # Logos aus images/*.svg neu erzeugen
node scripts/pwa-symbole.mjs      # App-Symbole aus app/icon.svg neu erzeugen
```

Beide Skripte nur nötig, wenn sich das Logo ändert.

## Veröffentlichen

Ein `git push` auf `main` genügt — Vercel baut und veröffentlicht von selbst.

Die Umgebungsvariablen müssen dort **eigens** eingetragen sein; `.env.local`
liegt nur auf dem eigenen Rechner und wird bewusst nicht mitgeliefert.

`SMS_TESTMODUS` gehört **nicht** auf Vercel. Stünde dort versehentlich „an",
würden echte Bewertungs-SMS stillschweigend verschluckt.
