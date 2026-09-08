"use client";

import { useRef } from "react";

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
   * würde jeder Tastendruck und jede Mausbewegung die ganze Reihe neu
   * zeichnen lassen.
   */
  function bewegeZu(ziel: HTMLElement | null) {
    const markierung = markierungRef.current;
    const reihe = reiheRef.current;
    if (!markierung || !reihe || !ziel) return;

    const rahmen = reihe.getBoundingClientRect();
    const feld = ziel.getBoundingClientRect();

    markierung.style.width = `${feld.width}px`;
    markierung.style.height = `${feld.height}px`;
    markierung.style.transform = `translateX(${feld.left - rahmen.left}px)`;
    markierung.style.opacity = "1";
  }

  return (
    <div
      ref={reiheRef}
      onMouseLeave={() => bewegeZu(aktivRef.current)}
      className="relative inline-flex flex-wrap gap-1 rounded-xl border bg-muted/40 p-1"
    >
      <span
        ref={markierungRef}
        aria-hidden
        className="pointer-events-none absolute top-1 left-1 rounded-lg bg-card opacity-0 shadow-sm"
        style={{
          transition:
            "transform 380ms var(--ease-federnd), width 560ms var(--ease-federnd), opacity 200ms linear",
        }}
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
            className="weich block cursor-pointer rounded-lg px-4 py-2 text-sm text-muted-foreground peer-checked:text-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 hover:text-foreground"
          >
            {option.titel}
          </span>
        </label>
      ))}
    </div>
  );
}
