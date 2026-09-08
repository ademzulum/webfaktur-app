"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { bewegeMarkierung, MARKIERUNG_UEBERGANG } from "@/lib/markierung";

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
    bewegeMarkierung(markierungRef.current, reiheRef.current, ziel);
  }

  /**
   * Setzt die Markierung auf die aktuelle Kategorie - nach dem Einbau.
   *
   * React hängt die Verweise von innen nach außen ein: Die Kategorien
   * bekommen ihren VOR der Reihe, die sie umgibt. Würde hier während des
   * Einbaus gerechnet, fehlte der Bezugspunkt.
   */
  useEffect(() => {
    const reihe = reiheRef.current;
    if (!reihe) return;

    const setzen = (sofort = false) => {
      aktivRef.current = reihe.querySelector<HTMLElement>("[aria-current]");
      bewegeMarkierung(markierungRef.current, reihe, aktivRef.current, sofort);
    };

    setzen(true);

    const nachmessen = () => setzen();
    window.addEventListener("resize", nachmessen);
    document.fonts?.ready.then(nachmessen);

    return () => window.removeEventListener("resize", nachmessen);
  }, [aktuell]);

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
        className="pointer-events-none absolute top-0 left-0 rounded-lg bg-muted opacity-0"
        style={{ transition: MARKIERUNG_UEBERGANG }}
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
            onMouseEnter={(e) => bewegeZu(e.currentTarget)}
            onFocus={(e) => bewegeZu(e.currentTarget)}
            aria-current={gewaehlt ? "true" : undefined}
            className={
              "weich relative z-10 shrink-0 rounded-lg px-3.5 py-2 text-sm " +
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
