import { centAlsEuro } from "@/lib/geld";

export type Kampagnenwert = {
  name: string;
  cent: number;
  anrufe: number;
};

/**
 * Auftragswert je Kampagne.
 *
 * Bewusst KEINE Diagrammbibliothek mehr, sondern eine schlichte Liste aus
 * Balken. Die Gründe:
 *
 * 1. Die Zahl steht in derselben Zeile wie der Name, rechtsbündig - nicht
 *    neben dem Balkenende. Dadurch fluchten alle Beträge untereinander und
 *    lassen sich vergleichen, statt an wechselnden Stellen zu stehen.
 * 2. Alles Wichtige steht IM Bild, nichts versteckt sich in einem Feld,
 *    das erst beim Überfahren erscheint. Auf einem Telefon gibt es kein
 *    Überfahren - dort wären solche Angaben schlicht nicht erreichbar.
 * 3. Die Breite regelt der Browser. Es gibt keine feste Zeichenfläche, die
 *    auf kleinen Bildschirmen zu eng wird.
 *
 * Bewusst nur EINE Farbe: Es wird eine einzige Größe gezeigt. Verschiedene
 * Farben je Balken würden eine Bedeutung vortäuschen, die die Daten nicht
 * haben.
 */
export function KampagnenBalken({ daten }: { daten: Kampagnenwert[] }) {
  // Der längste Balken füllt die Breite aus, alle anderen richten sich
  // danach. So ist der Vergleich untereinander sofort ablesbar.
  const groesster = Math.max(...daten.map((d) => d.cent), 1);
  const gesamt = daten.reduce((summe, d) => summe + d.cent, 0);

  return (
    <ul className="space-y-5">
      {daten.map((eintrag, i) => {
        const breite = Math.max(2, (eintrag.cent / groesster) * 100);
        const anteil =
          gesamt === 0 ? 0 : Math.round((eintrag.cent / gesamt) * 100);

        return (
          <li
            key={eintrag.name}
            // Die ganze Zeile reagiert, nicht nur der Balken. Ein 14 Pixel
            // hoher Balken ist ein schlechtes Ziel für die Maus - die Zeile
            // ist zwanzigmal so groß.
            className="weich group -mx-2 rounded-lg px-2 py-2 hover:bg-muted/40"
          >
            <div className="flex items-baseline justify-between gap-4">
              <p className="min-w-0 truncate text-sm">
                {eintrag.name}
                <span className="ml-2 text-xs text-muted-foreground">
                  {eintrag.anrufe} {eintrag.anrufe === 1 ? "Anruf" : "Anrufe"}
                </span>
              </p>
              <p className="weich shrink-0 text-sm tabular-nums group-hover:text-primary">
                {centAlsEuro(eintrag.cent)}
              </p>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-muted sm:h-4">
                <div
                  className="balken weich h-full rounded-full bg-primary group-hover:brightness-110"
                  style={
                    {
                      width: `${breite}%`,
                      "--verzoegerung": i,
                    } as React.CSSProperties
                  }
                />
              </div>
              {/* Am Telefon zu wenig Platz - dort entfällt der Anteil, der
                  Betrag daneben sagt ohnehin dasselbe genauer. */}
              <span className="hidden w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground sm:block">
                {anteil} %
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
