import { centAlsEuro } from "@/lib/geld";

export type Kampagnenwert = {
  name: string;
  cent: number;
  anrufe: number;
};

/**
 * Auftragswert je Kampagne, als Anteil am Gesamtwert.
 *
 * WICHTIG - das war vorher falsch: Die Balken waren am größten Balken
 * ausgerichtet. Die stärkste Kampagne füllte damit die volle Breite, obwohl
 * daneben "46 %" stand. Balken und Zahl sagten also Unterschiedliches, und
 * der Balken sagte das Falsche.
 *
 * Jetzt ist die volle Breite der gesamte Auftragswert. 46 Prozent füllen 46
 * Prozent. Alle Balken zusammen ergeben genau die Breite einmal - man sieht
 * damit unmittelbar, wie sich der Umsatz auf die Kampagnen verteilt.
 *
 * Bewusst nur EINE Farbe: Es wird eine einzige Größe gezeigt. Verschiedene
 * Farben je Balken würden eine Bedeutung vortäuschen, die die Daten nicht
 * haben.
 */
export function KampagnenBalken({ daten }: { daten: Kampagnenwert[] }) {
  const gesamt = daten.reduce((summe, d) => summe + d.cent, 0);

  return (
    <ul className="space-y-5">
      {daten.map((eintrag, i) => {
        const anteil = gesamt === 0 ? 0 : (eintrag.cent / gesamt) * 100;

        return (
          <li
            key={eintrag.name}
            // Die ganze Zeile reagiert, nicht nur der Balken. Ein 16 Pixel
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
                      // Mindestens ein schmaler Rest, damit auch eine winzige
                      // Kampagne noch sichtbar ist statt ganz zu verschwinden.
                      width: `${Math.max(1.5, anteil)}%`,
                      "--verzoegerung": i,
                    } as React.CSSProperties
                  }
                />
              </div>
              <span className="w-11 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {Math.round(anteil)} %
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
