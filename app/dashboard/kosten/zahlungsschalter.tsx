"use client";

import { useTransition } from "react";

import { zahlungUmschalten } from "./actions";

/**
 * Schaltet zwischen "offen" und "bezahlt" um.
 *
 * Bewusst ein Knopf und kein Formular mit Absenden: Ein Klick, ein Zustand.
 * Während gespeichert wird, ist er gesperrt - sonst ließe sich durch
 * schnelles Klicken ein Zustand erzeugen, der nicht dem entspricht, was in
 * der Datenbank steht.
 */
export function Zahlungsschalter({
  betriebId,
  monat,
  bezahlt,
}: {
  betriebId: string;
  monat: string;
  bezahlt: boolean;
}) {
  const [laeuft, starten] = useTransition();

  return (
    <button
      type="button"
      disabled={laeuft}
      onClick={() =>
        starten(() => zahlungUmschalten(betriebId, monat, !bezahlt))
      }
      aria-pressed={bezahlt}
      className={
        "weich inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs disabled:opacity-50 " +
        (bezahlt
          ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
          : "border-dashed text-muted-foreground hover:bg-foreground/10 hover:text-foreground")
      }
    >
      <span
        className={
          "size-1.5 rounded-full " +
          (bezahlt ? "bg-primary" : "border border-muted-foreground")
        }
      />
      {bezahlt ? "bezahlt" : "offen"}
    </button>
  );
}
