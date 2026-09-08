"use client";

import { Moon, Sun } from "lucide-react";

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
      {/* Genau eines der beiden ist sichtbar - je nachdem, ob "dark" gesetzt
          ist. In der dunklen Ansicht die Sonne, weil sie das Ziel des Klicks
          zeigt, nicht den aktuellen Zustand. */}
      <Sun className="hidden size-4 transition-transform duration-300 dark:block" />
      <Moon className="size-4 transition-transform duration-300 dark:hidden" />
    </Button>
  );
}
