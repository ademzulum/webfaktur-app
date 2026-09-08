"use client";

import { useEffect } from "react";

/**
 * Meldet den Hintergrunddienst an.
 *
 * Bewusst NICHT in der Entwicklung: Dort würde er die automatische
 * Aktualisierung beim Speichern stören, weil er alte Dateien ausliefert.
 *
 * Bewusst erst nach dem vollständigen Laden: Die Anmeldung ist nichts,
 * worauf der Besucher wartet. Sie darf den ersten Seitenaufbau nicht
 * verlangsamen.
 *
 * Gibt nichts aus - dieser Baustein ist nur da, um etwas anzustoßen.
 */
export function Hintergrunddienst() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const anmelden = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Schlägt es fehl, läuft die Anwendung ohne ihn weiter. Sie
        // funktioniert dann nur nicht ohne Verbindung.
      });
    };

    if (document.readyState === "complete") {
      anmelden();
      return;
    }

    window.addEventListener("load", anmelden);
    return () => window.removeEventListener("load", anmelden);
  }, []);

  return null;
}
