"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { ZugangZustand } from "./actions";

const startzustand: ZugangZustand = {};

export function ZugangFormular({
  aktion,
}: {
  aktion: (
    zustand: ZugangZustand,
    formular: FormData,
  ) => Promise<ZugangZustand>;
}) {
  const [zustand, absenden, laeuft] = useActionState(aktion, startzustand);

  // Nach dem Anlegen zeigen wir die Zugangsdaten - und zwar genau einmal.
  // Das Passwort ist danach nirgends mehr abrufbar, auch nicht für uns:
  // Supabase legt nur einen Hash davon ab.
  if (zustand.zugangsdaten) {
    return (
      <div className="space-y-4 rounded-lg border border-dashed bg-muted/40 p-5">
        <div>
          <h2 className="font-medium">Zugang angelegt</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bitte jetzt notieren und dem Betrieb übermitteln. Das Passwort
            lässt sich später nicht mehr anzeigen — auch nicht von dir. Es
            liegt bei Supabase nur als nicht umkehrbarer Hash.
          </p>
        </div>

        <dl className="space-y-2 rounded-lg border bg-card p-4 text-card-foreground">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <dt className="text-sm text-muted-foreground">E-Mail</dt>
            <dd className="font-mono text-sm">{zustand.zugangsdaten.email}</dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <dt className="text-sm text-muted-foreground">Passwort</dt>
            <dd className="font-mono text-sm font-semibold break-all">
              {zustand.zugangsdaten.passwort}
            </dd>
          </div>
        </dl>

        <Button variant="outline" onClick={() => window.location.reload()}>
          Weiteren Zugang anlegen
        </Button>
      </div>
    );
  }

  return (
    <form action={absenden} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">E-Mail des Betriebs</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="off"
            placeholder="buero@dachdecker-muster.at"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name (optional)</Label>
          <Input
            id="name"
            name="name"
            autoComplete="off"
            placeholder="Maria Muster"
          />
        </div>
      </div>

      {zustand.fehler ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {zustand.fehler}
        </p>
      ) : null}

      <Button type="submit" disabled={laeuft}>
        {laeuft ? "Wird angelegt …" : "Zugang anlegen"}
      </Button>
    </form>
  );
}
