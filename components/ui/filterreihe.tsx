import Link from "next/link";

/**
 * Eine Reihe von Filtern oder Sortierungen.
 *
 * Bewusst als LINKS und nicht als Bedienelemente mit Zustand. Die Wahl steht
 * damit in der Adresse der Seite. Das hat drei Folgen, die alle nützlich sind:
 *
 * 1. Der Zurück-Knopf des Browsers funktioniert wie erwartet.
 * 2. Eine gefilterte Ansicht lässt sich weitergeben oder als Lesezeichen
 *    ablegen - die Adresse enthält ja alles.
 * 3. Gefiltert wird auf dem Server. Es muss nichts an den Browser geschickt
 *    werden, was dort ohnehin nur weggefiltert würde.
 */
export function Filterreihe({
  pfad,
  parameter,
  aktuell,
  optionen,
  weitere,
  beschriftung,
}: {
  pfad: string;
  parameter: string;
  aktuell: string;
  optionen: { wert: string; titel: string; anzahl?: number }[];
  /** Andere Einstellungen, die beim Umschalten erhalten bleiben sollen. */
  weitere?: Record<string, string>;
  beschriftung: string;
}) {
  return (
    <div
      role="group"
      aria-label={beschriftung}
      className="inline-flex flex-wrap gap-1 rounded-xl border bg-muted/40 p-1"
    >
      {optionen.map((option) => {
        const felder = new URLSearchParams({
          ...weitere,
          [parameter]: option.wert,
        });
        const gewaehlt = option.wert === aktuell;

        return (
          <Link
            key={option.wert}
            href={`${pfad}?${felder.toString()}`}
            aria-current={gewaehlt ? "true" : undefined}
            // Die Umschaltung läuft über einen Seitenwechsel. React
            // behält dabei diese Verweise und tauscht nur ihre Klassen aus -
            // deshalb greift der Übergang und die Auswahl gleitet
            // hinüber, statt umzuspringen.
            className={
              "weich rounded-lg px-3 py-2 text-sm " +
              (gewaehlt
                ? "scale-[1.02] bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-card/50 hover:text-foreground")
            }
          >
            {option.titel}
            {option.anzahl !== undefined ? (
              <span
                className={
                  "ml-2 text-xs tabular-nums " +
                  (gewaehlt ? "text-muted-foreground" : "opacity-70")
                }
              >
                {option.anzahl}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
