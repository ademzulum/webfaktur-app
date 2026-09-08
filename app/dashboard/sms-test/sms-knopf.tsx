"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import type { Versandzustand } from "./actions";

const startzustand: Versandzustand = {};

export function SmsKnopf({
  aktion,
  deaktiviert,
}: {
  aktion: (zustand: Versandzustand) => Promise<Versandzustand>;
  deaktiviert?: string;
}) {
  const [zustand, absenden, laeuft] = useActionState(aktion, startzustand);

  if (deaktiviert) {
    return (
      <span className="text-sm text-muted-foreground">{deaktiviert}</span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={absenden}>
        <Button type="submit" size="sm" variant="outline" disabled={laeuft}>
          {laeuft ? "Sendet …" : "SMS senden"}
        </Button>
      </form>
      {zustand.meldung ? (
        <span
          role="status"
          className={
            zustand.ok
              ? "max-w-xs text-right text-xs text-emerald-600 dark:text-emerald-500"
              : "max-w-xs text-right text-xs text-destructive"
          }
        >
          {zustand.meldung}
        </span>
      ) : null}

      {zustand.link ? (
        <a
          href={zustand.link}
          className="max-w-xs break-all text-right text-xs font-medium underline underline-offset-2"
        >
          {zustand.link}
        </a>
      ) : null}
    </div>
  );
}
