"use client";

import { useRef } from "react";

import { bewegeMarkierung, MARKIERUNG_UEBERGANG } from "@/lib/markierung";

/**
 * Eine Reihe von Auswahlmöglichkeiten, von denen genau eine gilt.
 *
 * Statt eines Eingabefelds, in das man den Paketnamen tippen muss: Man
 * sieht sofort, welche Möglichkeiten es gibt, und kann sich nicht
 * verschreiben.
 *
 * Die Markierung gleitet von einer Möglichkeit zur nächsten - dieselbe
 * Bewegung wie im Menü der Kopfleiste und bei den Kategorien der
 * Anrufliste. Die Breite folgt dabei langsamer als die Position, dadurch
 * zieht sich die Markierung beim Wandern kurz in die Länge.
 *
 * Darunter liegen normale Auswahlknöpfe (Radio-Felder), nur unsichtbar.
 * Damit schickt das Formular den Wert von selbst mit und die Bedienung
 * per Tastatur funktioniert ohne Zutun.
 */
export function Auswahlreihe({
  name,
  optionen,
  gewaehlt,
}: {
  name: string;
  optionen: { wert: string; titel: string }[];
  gewaehlt: string;
}) {
  const reiheRef = useRef<HTMLDivElement | null>(null);
  const markierungRef = useRef<HTMLSpanElement | null>(null);
  const aktivRef = useRef<HTMLElement | null>(null);

  /**
   * Schiebt die Markierung unter das übergebene Element.
   *
   * Bewusst über die DOM-Eigenschaften statt über React-Zustand: Sonst
   * würde jeder Tastendruck die ganze Reihe neu zeichnen lassen.
   */
  function bewegeZu(ziel: HTMLElement | null) {
    bewegeMarkierung(markierungRef.current, reiheRef.current, ziel);
  }

  return (
    <div
      ref={reiheRef}
      onMouseLeave={() => bewegeZu(aktivRef.current)}
      className="relative inline-flex flex-wrap gap-1 rounded-full border bg-muted/40 p-1"
    >
      {/* Vollrund wie im Kopfmenü und bei den Kategorien. Alle gleitenden
          Markierungen der Anwendung haben dieselbe Form - eine mit anderem
          Eckenradius wirkte wie ein anderes Bedienelement. */}
      <span
        ref={markierungRef}
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 rounded-full bg-card opacity-0 shadow-sm"
        style={{ transition: MARKIERUNG_UEBERGANG }}
      />

      {optionen.map((option) => (
        <label key={option.wert} className="relative z-10">
          <input
            type="radio"
            name={name}
            value={option.wert}
            defaultChecked={option.wert === gewaehlt}
            // Beim Umschalten wandert die Markierung zur neuen Wahl.
            // "currentTarget" ist das Auswahlfeld, gemessen werden muss aber
            // die sichtbare Beschriftung darum herum.
            onChange={(e) => {
              const feld = e.currentTarget.parentElement;
              aktivRef.current = feld;
              bewegeZu(feld);
            }}
            className="peer sr-only"
          />
          <span
            ref={(el) => {
              // Nur die anfangs gewählte Möglichkeit legt die Startposition
              // fest. Danach übernimmt onChange.
              if (option.wert !== gewaehlt || aktivRef.current) return;
              aktivRef.current = el?.parentElement ?? null;
              bewegeZu(aktivRef.current);

              // Beim Laden sind die Schriften oft noch nicht da, die Wörter
              // werden danach breiter. Und bei Größenänderung des Fensters
              // stimmt die Position ebenfalls nicht mehr.
              const nachmessen = () => bewegeZu(aktivRef.current);
              window.addEventListener("resize", nachmessen);
              document.fonts?.ready.then(nachmessen);

              return () => window.removeEventListener("resize", nachmessen);
            }}
            className="weich block cursor-pointer rounded-full px-4 py-2 text-sm text-muted-foreground peer-checked:text-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 hover:text-foreground"
          >
            {option.titel}
          </span>
        </label>
      ))}
    </div>
  );
}
