"use client";

import Link from "next/link";
import { useRef } from "react";

export type Kategorie = {
  wert: string;
  titel: string;
  anzahl?: number;
};

/**
 * Die Kategorien, mit einer gleitenden Markierung.
 *
 * Bewusst ohne Rahmen und ohne Kasten: Vorher saßen zwei umrandete Gruppen
 * nebeneinander, die schwerer wogen als die Liste, die sie steuern. Jetzt
 * sind es nur Wörter, und die Markierung gleitet dahinter von einem zum
 * nächsten - dasselbe Verhalten wie im Menü der Kopfleiste, damit die
 * Oberfläche an beiden Stellen gleich funktioniert.
 *
 * Bewusst weiterhin LINKS und nicht Bedienelemente mit Zustand: Die Wahl
 * steht damit in der Adresse. Der Zurück-Knopf funktioniert, eine gefilterte
 * Ansicht lässt sich weitergeben, und gefiltert wird auf dem Server.
 */
export function Kategoriewahl({
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
  optionen: Kategorie[];
  /** Andere Einstellungen, die beim Umschalten erhalten bleiben sollen. */
  weitere?: Record<string, string>;
  beschriftung: string;
}) {
  const reiheRef = useRef<HTMLDivElement | null>(null);
  const markierungRef = useRef<HTMLSpanElement | null>(null);
  const aktivRef = useRef<HTMLElement | null>(null);

  /**
   * Schiebt die Markierung unter das übergebene Element.
   *
   * Bewusst über die DOM-Eigenschaften statt über React-Zustand: Sonst
   * würde jede Mausbewegung die ganze Reihe neu zeichnen lassen.
   */
  function bewegeZu(ziel: HTMLElement | null) {
    const markierung = markierungRef.current;
    const reihe = reiheRef.current;
    if (!markierung || !reihe || !ziel) return;

    const rahmen = reihe.getBoundingClientRect();
    const feld = ziel.getBoundingClientRect();

    markierung.style.width = `${feld.width}px`;
    // Der Rollstand zählt mit: Auf schmalen Bildschirmen lässt sich die
    // Reihe seitlich schieben, und dann stimmt die reine Bildschirmposition
    // nicht mehr mit der Position innerhalb der Reihe überein.
    markierung.style.transform = `translateX(${feld.left - rahmen.left + reihe.scrollLeft}px)`;
    markierung.style.opacity = "1";
  }

  return (
    <div
      ref={reiheRef}
      role="group"
      aria-label={beschriftung}
      onMouseLeave={() => bewegeZu(aktivRef.current)}
      className="ohne-rollleiste relative -mx-1 flex items-center gap-1 overflow-x-auto px-1 py-1"
    >
      {/* Die Markierung. Die Breite folgt langsamer als die Position -
          dadurch zieht sie sich beim Wandern kurz in die Länge. */}
      <span
        ref={markierungRef}
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-0 h-9 -translate-y-1/2 rounded-full bg-muted opacity-0"
        style={{
          transition:
            "transform 380ms var(--ease-federnd), width 560ms var(--ease-federnd), opacity 200ms linear",
        }}
      />

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
            // Ohne das springt die Seite bei jedem Umschalten nach oben.
            // Next.js scrollt bei einem Seitenwechsel standardmäßig an den
            // Anfang - richtig, wenn man wirklich woandershin geht, falsch
            // beim Filtern.
            scroll={false}
            ref={(el) => {
              if (!gewaehlt) return;
              aktivRef.current = el;
              bewegeZu(el);

              // Beim Laden sind die Schriften oft noch nicht da, die Wörter
              // werden danach breiter. Und bei Größenänderung des Fensters
              // stimmt die Position ebenfalls nicht mehr.
              const nachmessen = () => bewegeZu(aktivRef.current);
              window.addEventListener("resize", nachmessen);
              document.fonts?.ready.then(nachmessen);

              return () => window.removeEventListener("resize", nachmessen);
            }}
            onMouseEnter={(e) => bewegeZu(e.currentTarget)}
            onFocus={(e) => bewegeZu(e.currentTarget)}
            aria-current={gewaehlt ? "true" : undefined}
            className={
              "weich relative z-10 shrink-0 rounded-full px-3.5 py-2 text-sm " +
              (gewaehlt
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {option.titel}
            {option.anzahl !== undefined ? (
              <span
                className={
                  "ml-2 text-xs tabular-nums " +
                  (gewaehlt ? "text-primary" : "text-muted-foreground/60")
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
