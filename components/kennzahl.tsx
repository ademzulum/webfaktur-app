import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

/**
 * Wählt die Schriftgröße nach der Länge der Zahl.
 *
 * Der Grund: "12" und "1.284.900,00 €" stehen in derselben Kachel. Eine feste
 * Größe passt entweder für das eine oder für das andere. Statt die Zahl
 * abzuschneiden oder umbrechen zu lassen, wird sie kleiner, sobald sie länger
 * wird - so bleibt sie immer vollständig lesbar.
 *
 * Bewusst nach Zeichenanzahl und nicht nach gemessener Breite: DM Mono hat
 * für jedes Zeichen dieselbe Breite. Die Zeichenanzahl IST damit die Breite,
 * und die Berechnung kann schon auf dem Server stattfinden.
 */
function groesseFuer(text: string): string {
  const laenge = text.length;
  if (laenge <= 7) return "text-3xl sm:text-4xl";
  if (laenge <= 10) return "text-2xl sm:text-3xl";
  if (laenge <= 13) return "text-xl sm:text-2xl";
  return "text-lg sm:text-xl";
}

/**
 * Eine Kennzahl als Kachel.
 *
 * Wird auf der Übersicht UND in der Anrufauswertung verwendet, damit beide
 * gleich aussehen und sich gleich verhalten. Vorher hatte jede Seite ihre
 * eigene Fassung - dadurch bewegte sich die eine beim Überfahren und die
 * andere nicht.
 *
 * Mit "pfad" wird die Kachel zum Link, ohne bleibt sie eine Anzeigefläche.
 */
export function Kennzahlkachel({
  titel,
  wert,
  zusatz,
  pfad,
  hervorgehoben,
}: {
  titel: string;
  wert: string;
  zusatz?: string;
  pfad?: string;
  hervorgehoben?: boolean;
}) {
  const inhalt = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          {titel}
        </p>
        {pfad ? (
          <ArrowUpRight className="weich size-4 shrink-0 text-muted-foreground group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
        ) : null}
      </div>
      <div className="min-w-0">
        <p
          className={
            "font-medium tabular-nums " +
            groesseFuer(wert) +
            (hervorgehoben ? " text-primary" : "")
          }
        >
          {wert}
        </p>
        {zusatz ? (
          <p className="mt-1.5 text-sm text-muted-foreground">{zusatz}</p>
        ) : null}
      </div>
    </>
  );

  const klassen =
    "karte group flex flex-col justify-between gap-6 overflow-hidden rounded-xl border bg-card p-5 hover:border-primary/50 hover:bg-muted/30 sm:p-6" +
    (hervorgehoben ? " border-primary/40" : "");

  if (!pfad) return <div className={klassen}>{inhalt}</div>;

  return (
    <Link
      href={pfad}
      className={
        klassen +
        " focus-visible:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      }
    >
      {inhalt}
    </Link>
  );
}
