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
    if (ziel) aktivRef.current = ziel;
    bewegeMarkierung(markierungRef.current, reiheRef.current, ziel);
  }

  return (
    <div
      ref={reiheRef}
      className="relative inline-flex flex-wrap gap-1 rounded-xl border bg-muted/40 p-1"
    >
      <span
        ref={markierungRef}
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 rounded-lg bg-card opacity-0 shadow-sm"
        style={{ transition: MARKIERUNG_UEBERGANG }}
      />

      {optionen.map((option) => (
        // "inline-flex" ist hier nicht Geschmack, sondern nötig: Ohne das
        // wäre die Beschriftung ein Fließtext-Element, und ein solches hat
        // keine verlässlichen Maße. Genau daran ist die Markierung vorher
        // vorbeigerutscht - sie hat den Umriss des Textflusses gemessen
        // statt den des sichtbaren Feldes.
        <label key={option.wert} className="relative z-10 inline-flex">
          <input
            type="radio"
            name={name}
            value={option.wert}
            defaultChecked={option.wert === gewaehlt}
            // Beim Umschalten wandert die Markierung zur neuen Wahl.
            // Gemessen wird die Beschriftung daneben, nicht das Auswahlfeld
            // selbst - das ist unsichtbar und hat keine Ausdehnung.
            onChange={(e) =>
              bewegeZu(e.currentTarget.nextElementSibling as HTMLElement)
            }
            className="peer sr-only"
          />
          <span
            ref={(el) => {
              if (option.wert !== gewaehlt) return;

              // Beim ersten Zeichnen die Startposition setzen. Wurde
              // inzwischen etwas anderes gewählt, bleibt diese Wahl stehen.
              bewegeZu(aktivRef.current ?? el);

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
