"use client";

import { useEffect, useRef } from "react";

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
   * Setzt die Markierung an ihren Platz - nach dem Einbau, nicht währenddessen.
   *
   * WARUM HIER UND NICHT BEIM EINHÄNGEN DER ELEMENTE:
   * React hängt die Verweise von innen nach außen ein. Die Beschriftungen
   * bekommen ihren Verweis also VOR dem Kasten, der sie umgibt. Wurde die
   * Position dort berechnet, gab es den Kasten noch gar nicht - und ohne
   * Bezugspunkt blieb die Markierung in der linken oberen Ecke liegen.
   *
   * Das hier läuft, wenn alles steht. Damit kann es nicht mehr schiefgehen.
   */
  useEffect(() => {
    const reihe = reiheRef.current;
    if (!reihe) return;

    const setzen = (sofort = false) => {
      aktivRef.current = reihe.querySelector<HTMLElement>(
        `[data-feld="${gewaehlt}"]`,
      );
      bewegeMarkierung(markierungRef.current, reihe, aktivRef.current, sofort);
    };

    setzen(true);

    // Beim Laden sind die Schriften oft noch nicht da, die Wörter werden
    // danach breiter. Und bei Größenänderung des Fensters stimmt die
    // Position ebenfalls nicht mehr.
    const nachmessen = () =>
      bewegeMarkierung(markierungRef.current, reihe, aktivRef.current);
    window.addEventListener("resize", nachmessen);
    document.fonts?.ready.then(nachmessen);

    return () => window.removeEventListener("resize", nachmessen);
  }, [gewaehlt]);

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
        // "inline-flex" ist nicht Geschmack, sondern nötig: Ohne das wäre die
        // Beschriftung ein Element des Textflusses, und ein solches hat keine
        // verlässlichen Maße.
        <label key={option.wert} className="relative z-10 inline-flex">
          <input
            type="radio"
            name={name}
            value={option.wert}
            defaultChecked={option.wert === gewaehlt}
            // Beim Umschalten wandert die Markierung zur neuen Wahl.
            // Gemessen wird die Beschriftung daneben, nicht das Auswahlfeld
            // selbst - das ist unsichtbar und hat keine Ausdehnung.
            onChange={(e) => {
              aktivRef.current = e.currentTarget
                .nextElementSibling as HTMLElement;
              bewegeMarkierung(
                markierungRef.current,
                reiheRef.current,
                aktivRef.current,
              );
            }}
            className="peer sr-only"
          />
          <span
            data-feld={option.wert}
            className="weich block cursor-pointer rounded-lg px-4 py-2 text-sm text-muted-foreground peer-checked:text-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 hover:text-foreground"
          >
            {option.titel}
          </span>
        </label>
      ))}
    </div>
  );
}
