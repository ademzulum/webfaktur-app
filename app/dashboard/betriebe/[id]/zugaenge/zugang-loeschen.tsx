"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";

import type { LoeschZustand } from "./actions";

const startzustand: LoeschZustand = {};

/**
 * Löschknopf mit Rückfrage in zwei Schritten.
 *
 * Bewusst kein Browser-Bestätigungsfenster: Das lässt sich unterdrücken und
 * sieht auf jedem Gerät anders aus. Der erste Klick verwandelt den Knopf,
 * der zweite löscht - dazwischen kann man jederzeit abbrechen.
 */
export function ZugangLoeschen({
  aktion,
}: {
  aktion: (zustand: LoeschZustand) => Promise<LoeschZustand>;
}) {
  const [zustand, ausfuehren, laeuft] = useActionState(aktion, startzustand);
  const [gefragt, setGefragt] = useState(false);

  if (!gefragt) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setGefragt(true)}
          className="text-muted-foreground transition-colors hover:text-destructive"
        >
          Entfernen
        </Button>
        {zustand.fehler ? (
          <span role="alert" className="max-w-56 text-right text-xs text-destructive">
            {zustand.fehler}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <span className="text-xs text-muted-foreground">Wirklich entfernen?</span>
      <form action={ausfuehren}>
        <Button type="submit" size="sm" variant="destructive" disabled={laeuft}>
          {laeuft ? "…" : "Ja, entfernen"}
        </Button>
      </form>
      <Button size="sm" variant="ghost" onClick={() => setGefragt(false)}>
        Abbrechen
      </Button>
    </div>
  );
}
