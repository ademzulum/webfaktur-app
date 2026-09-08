"use client";

import { Button } from "@/components/ui/button";

const SPEICHER = "webfaktur-theme";

/**
 * Umschalter zwischen dunkler und heller Ansicht.
 *
 * Bewusst OHNE React-Zustand: Welches Symbol zu sehen ist, entscheidet CSS
 * anhand der Klasse "dark" auf <html>. Dadurch stimmt die Anzeige vom ersten
 * Moment an - auch bevor React im Browser übernommen hat - und es gibt keinen
 * Unterschied zwischen dem, was der Server liefert, und dem, was der Browser
 * daraus macht.
 *
 * Die Voreinstellung (dunkel) setzt das kleine Skript in app/layout.tsx.
 */
export function ThemeUmschalter() {
  function umschalten() {
    const dunkelJetzt = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem(SPEICHER, dunkelJetzt ? "dunkel" : "hell");
    } catch {
      // Manche Browser sperren den Speicher. Dann gilt die Wahl eben nur für
      // diesen Besuch - kein Grund, hier abzubrechen.
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={umschalten}
      aria-label="Zwischen heller und dunkler Ansicht wechseln"
      title="Ansicht wechseln"
    >
      <SonneMond />
    </Button>
  );
}

/**
 * Eine Scheibe, die sich vom Mond zur Sonne verwandelt.
 *
 * Es sind nicht zwei Symbole, sondern immer dasselbe: eine Scheibe, aus der
 * ein zweiter Kreis eine Sichel ausknabbert. Fährt dieser Kreis aus dem Bild,
 * wird aus der Sichel eine volle Scheibe, sie schrumpft, und die Strahlen
 * drehen sich heraus. Deshalb ist es eine Bewegung und kein Umschalten.
 *
 * Wohin sich das Symbol verwandelt, steuert allein die Klasse "dark" auf
 * <html> - siehe die Regeln in globals.css.
 */
function SonneMond() {
  const strahlen: [number, number, number, number][] = [
    [12, 4, 12, 1.5],
    [20, 12, 22.5, 12],
    [12, 20, 12, 22.5],
    [4, 12, 1.5, 12],
    [17.66, 6.34, 19.42, 4.58],
    [17.66, 17.66, 19.42, 19.42],
    [6.34, 17.66, 4.58, 19.42],
    [6.34, 6.34, 4.58, 4.58],
  ];

  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <mask id="sichel">
        {/* Weiß heißt sichtbar, Schwarz heißt ausgespart. */}
        <rect x="0" y="0" width="24" height="24" fill="white" />
        <circle cx="19" cy="5" r="9" fill="black" className="umschalt-maske" />
      </mask>

      <circle
        cx="12"
        cy="12"
        r="9"
        fill="currentColor"
        mask="url(#sichel)"
        className="umschalt-kern"
      />

      <g
        className="umschalt-strahlen"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        {strahlen.map(([x1, y1, x2, y2]) => (
          <line key={`${x1}-${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
      </g>
    </svg>
  );
}
