import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export type Kachel = {
  titel: string;
  wert: string;
  zusatz?: string;
  pfad?: string;
  hervorgehoben?: boolean;
};

/**
 * Wählt EINE Schriftgröße für eine ganze Reihe von Kacheln.
 *
 * Vorher entschied jede Kachel für sich - dadurch stand "12" groß neben
 * "1.284.900,00 €" klein, und die Reihe wirkte zusammengewürfelt. Jetzt
 * richtet sich die ganze Reihe nach ihrer längsten Zahl. Alle vier sind
 * damit immer gleich groß, und die längste passt trotzdem hinein.
 *
 * Bewusst nach Zeichenanzahl und nicht nach gemessener Breite: DM Mono hat
 * für jedes Zeichen dieselbe Breite. Die Zeichenanzahl IST damit die Breite,
 * und die Berechnung kann schon auf dem Server stattfinden.
 */
function groesseFuer(laengste: number): string {
  if (laengste <= 7) return "text-3xl sm:text-4xl";
  if (laengste <= 10) return "text-2xl sm:text-3xl";
  if (laengste <= 13) return "text-xl sm:text-2xl";
  return "text-lg sm:text-xl";
}

/**
 * Eine Reihe Kennzahlen.
 *
 * Wird auf der Übersicht UND in der Anrufauswertung verwendet, damit beide
 * gleich aussehen und sich gleich verhalten.
 */
export function Kennzahlreihe({ kacheln }: { kacheln: Kachel[] }) {
  const groesse = groesseFuer(
    Math.max(...kacheln.map((k) => k.wert.length), 1),
  );

  return (
    <section className="auftauchen-gestaffelt grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kacheln.map((kachel, i) => (
        <div
          key={kachel.titel}
          style={{ "--verzoegerung": i } as React.CSSProperties}
        >
          <Kennzahlkachel kachel={kachel} groesse={groesse} />
        </div>
      ))}
    </section>
  );
}

/** Mit "pfad" wird die Kachel zum Link, ohne bleibt sie eine Anzeigefläche. */
function Kennzahlkachel({
  kachel,
  groesse,
}: {
  kachel: Kachel;
  groesse: string;
}) {
  const inhalt = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          {kachel.titel}
        </p>
        {kachel.pfad ? (
          <ArrowUpRight className="weich size-4 shrink-0 text-muted-foreground group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
        ) : null}
      </div>
      <div className="min-w-0">
        <p
          className={
            "font-medium tabular-nums " +
            groesse +
            (kachel.hervorgehoben ? " text-primary" : "")
          }
        >
          {kachel.wert}
        </p>
        {kachel.zusatz ? (
          <p className="mt-1.5 text-sm text-muted-foreground">
            {kachel.zusatz}
          </p>
        ) : null}
      </div>
    </>
  );

  const klassen =
    "karte group flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border bg-card p-5 hover:border-primary/50 hover:bg-muted/30 sm:p-6" +
    (kachel.hervorgehoben ? " border-primary/40" : "");

  if (!kachel.pfad) return <div className={klassen}>{inhalt}</div>;

  return (
    <Link
      href={kachel.pfad}
      className={
        klassen +
        " focus-visible:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      }
    >
      {inhalt}
    </Link>
  );
}
