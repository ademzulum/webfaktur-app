export type Verlaufsmonat = {
  monat: string;
  anrufe_gesamt: number;
  bewertete_anrufe: number;
  marge_cent: number;
};

/**
 * Sechs Monate Anrufaufkommen als kleine Balkenreihe.
 *
 * Gezeigt werden die ANRUFE, nicht die Marge - und das hat einen Grund, der
 * einem beim Bauen auffällt: Verkaufspreis und matelso-Kosten sind je Monat
 * fest, veränderlich sind allein die SMS-Kosten. Eine Margenkurve wäre
 * deshalb fast eine Gerade, die mit steigender Anrufzahl leicht FÄLLT. Sie
 * sähe nach Erkenntnis aus und wäre keine.
 *
 * Der letzte Balken ist der laufende Monat und deshalb hervorgehoben - er
 * ist noch nicht vollständig und darf nicht mit den anderen verglichen
 * werden.
 */
export function Verlaufsbalken({ monate }: { monate: Verlaufsmonat[] }) {
  if (monate.length === 0)
    return <span className="text-muted-foreground">—</span>;

  const groesster = Math.max(...monate.map((m) => m.anrufe_gesamt), 1);

  return (
    <div className="flex h-8 items-end gap-1" aria-hidden>
      {monate.map((m, i) => {
        const laufend = i === monate.length - 1;
        const anteil = (m.anrufe_gesamt / groesster) * 100;

        return (
          <span
            key={m.monat}
            // Der Titel ist die Beschriftung für die Maus. Die Zahlen des
            // laufenden Monats stehen ohnehin ausgeschrieben in der Zeile.
            title={`${new Date(m.monat).toLocaleDateString("de-AT", {
              month: "short",
              year: "numeric",
            })}: ${m.anrufe_gesamt} Anrufe`}
            className={
              "w-2 rounded-sm " +
              (laufend ? "bg-primary" : "bg-muted-foreground/35")
            }
            // Mindestens zwei Pixel, damit ein Monat ohne Anrufe als leerer
            // Strich sichtbar bleibt statt ganz zu verschwinden.
            style={{ height: `${Math.max(8, anteil)}%` }}
          />
        );
      })}
    </div>
  );
}
