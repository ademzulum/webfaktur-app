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
  { text: string; auftrag: boolean }
> = {
  kein_auftrag: { text: "Kein Auftrag", auftrag: false },
  klein: { text: "Kleiner Auftrag", auftrag: true },
  mittel: { text: "Mittlerer Auftrag", auftrag: true },
  gross: { text: "Großer Auftrag", auftrag: true },
};

function dauerLesbar(sekunden: number | null): string {
  if (sekunden === null) return "Dauer unbekannt";
  const min = Math.floor(sekunden / 60);
  const sek = sekunden % 60;
  return min === 0 ? `${sek} s` : `${min}:${String(sek).padStart(2, "0")} min`;
}

/**
 * Das Kennzeichen oben links auf jeder Karte.
 *
 * Der farbige Streifen an der Seite ist bewusst ENTFERNT worden. Er musste
 * drei Zustände über eine einzige Farbe ausdrücken - orange, blass, gar
 * nichts - und benannte keinen davon. Wer die Bedeutung nicht auswendig
 * wusste, konnte sie nirgends nachlesen, und "gar nichts" war überhaupt nur
 * im Vergleich mit einer Nachbarkarte zu erkennen.
 *
 * Jetzt steht auf jeder Karte in Worten, woran man ist. Die Farbe kommt
 * dazu, sie trägt die Aussage aber nicht allein - wichtig für alle, die
 * Farben schlecht unterscheiden.
 */
function Kennzeichen({ ergebnis }: { ergebnis: Anrufdaten["ergebnis"] }) {
  if (ergebnis === null) {
    return (
      <span className="inline-flex items-center gap-2 rounded-lg border border-dashed px-2.5 py-1 text-xs text-muted-foreground">
        <span className="size-1.5 rounded-full border border-muted-foreground" />
        Noch nicht bewertet
      </span>
    );
  }

  const { text, auftrag } = BESCHRIFTUNG[ergebnis];

  return (
    <span
      className={
        "inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs " +
        (auftrag
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-transparent bg-muted text-muted-foreground")
      }
    >
      <span
        className={
          "size-1.5 rounded-full " +
          (auftrag ? "bg-primary" : "bg-muted-foreground/50")
        }
      />
      {text}
    </span>
  );
}

/**
 * Ein Anruf als Karte statt als Tabellenzeile.
 *
 * Der Vorteil gegenüber einer Tabelle: Die wichtigste Angabe darf groß
 * sein, Nebensächliches klein. In einer Tabelle bekommt jede Spalte
 * gleich viel Gewicht, egal wie wichtig sie ist.
 */
export function AnrufKarte({ anruf }: { anruf: Anrufdaten }) {
  const bewertet = anruf.ergebnis !== null;

  const zeitpunkt = new Date(anruf.beginn).toLocaleString("de-AT", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article className="karte rounded-xl border bg-card p-5 hover:border-primary/40 hover:bg-muted/20 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Kennzeichen ergebnis={anruf.ergebnis} />
        <time dateTime={anruf.beginn} className="text-xs text-muted-foreground">
          {zeitpunkt}
        </time>
      </div>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="min-w-0 text-base break-all">
          {anruf.anrufer_nummer ?? "Nummer unbekannt"}
        </p>
        {bewertet ? (
          <p className="shrink-0 text-lg tabular-nums">
            {centAlsEuro(anruf.wert_cent ?? 0)}
          </p>
        ) : null}
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        {dauerLesbar(anruf.dauer_sekunden)}
        {anruf.betrieb ? <> &middot; {anruf.betrieb}</> : null}
      </p>

      {anruf.kampagne || anruf.keyword ? (
        <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
          {anruf.kampagne ?? "ohne Kampagne"}
          {anruf.keyword ? <> &middot; {anruf.keyword}</> : null}
        </p>
      ) : null}
    </article>
  );
}
