import { centAlsEuro } from "@/lib/geld";

export type Anrufdaten = {
  id: string;
  beginn: string;
  anrufer_nummer: string | null;
  dauer_sekunden: number | null;
  kampagne: string | null;
  keyword: string | null;
  betrieb: string | null;
  ergebnis: "kein_auftrag" | "klein" | "mittel" | "gross" | null;
  wert_cent: number | null;
};

const BESCHRIFTUNG: Record<
  NonNullable<Anrufdaten["ergebnis"]>,
  { text: string; farbe: string }
> = {
  kein_auftrag: { text: "Kein Auftrag", farbe: "text-muted-foreground" },
  klein: { text: "Kleiner Auftrag", farbe: "text-foreground" },
  mittel: { text: "Mittlerer Auftrag", farbe: "text-foreground" },
  gross: { text: "Großer Auftrag", farbe: "text-foreground" },
};

function dauerLesbar(sekunden: number | null): string {
  if (sekunden === null) return "unbekannt";
  const min = Math.floor(sekunden / 60);
  const sek = sekunden % 60;
  return min === 0 ? `${sek} s` : `${min}:${String(sek).padStart(2, "0")} min`;
}

/**
 * Ein Anruf als Karte statt als Tabellenzeile.
 *
 * Der Vorteil gegenüber einer Tabelle: Die wichtigste Angabe darf gross
 * sein, Nebensächliches klein. In einer Tabelle bekommt jede Spalte
 * gleich viel Gewicht, egal wie wichtig sie ist.
 *
 * Der farbige Streifen links zeigt auf einen Blick, ob schon bewertet wurde.
 */
export function AnrufKarte({ anruf }: { anruf: Anrufdaten }) {
  const bewertet = anruf.ergebnis !== null;
  const auftrag = bewertet && anruf.ergebnis !== "kein_auftrag";

  const zeitpunkt = new Date(anruf.beginn).toLocaleString("de-AT", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article className="weich group relative overflow-hidden rounded-xl border bg-card p-4 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted/30 sm:p-5">
      {/* Streifen links: orange bei Auftrag, blass bei "kein Auftrag",
          gar nicht sichtbar solange offen. */}
      <span
        aria-hidden
        className={
          "weich absolute inset-y-0 left-0 w-[3px] " +
          (auftrag
            ? "bg-primary"
            : bewertet
              ? "bg-border"
              : "bg-transparent")
        }
      />

      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="font-mono text-base break-all">
            {anruf.anrufer_nummer ?? "Nummer unbekannt"}
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {zeitpunkt} &middot; {dauerLesbar(anruf.dauer_sekunden)}
            {anruf.betrieb ? <> &middot; {anruf.betrieb}</> : null}
          </p>
        </div>

        <div className="text-right">
          {bewertet ? (
            <>
              <p className="font-mono text-lg tabular-nums">
                {centAlsEuro(anruf.wert_cent ?? 0)}
              </p>
              <p
                className={
                  "mt-0.5 text-xs " + BESCHRIFTUNG[anruf.ergebnis!].farbe
                }
              >
                {BESCHRIFTUNG[anruf.ergebnis!].text}
              </p>
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed px-2.5 py-1 font-mono text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-muted-foreground/60" />
              offen
            </span>
          )}
        </div>
      </div>

      {anruf.kampagne || anruf.keyword ? (
        <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
          {anruf.kampagne ?? "ohne Kampagne"}
          {anruf.keyword ? (
            <>
              {" "}
              &middot;{" "}
              <span className="font-mono">{anruf.keyword}</span>
            </>
          ) : null}
        </p>
      ) : null}
    </article>
  );
}
