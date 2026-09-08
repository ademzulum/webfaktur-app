import Link from "next/link";

/**
 * Die Reihenfolge der Liste.
 *
 * Bewusst zurückhaltender als die Kategorien: Nur kleine Wörter, die
 * gewählte mit einem farbigen Strich darunter. Es ist die zweitwichtigere
 * Entscheidung auf dieser Seite und soll nicht mit der ersten um
 * Aufmerksamkeit ringen.
 */
export function Sortierwahl({
  pfad,
  parameter,
  aktuell,
  optionen,
  weitere,
}: {
  pfad: string;
  parameter: string;
  aktuell: string;
  optionen: { wert: string; titel: string }[];
  weitere?: Record<string, string>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
      <span className="text-muted-foreground/70">Sortiert nach</span>
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
            scroll={false}
            aria-current={gewaehlt ? "true" : undefined}
            className={
              "weich underline-offset-[6px] " +
              (gewaehlt
                ? "text-foreground underline decoration-primary decoration-2"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {option.titel}
          </Link>
        );
      })}
    </div>
  );
}
