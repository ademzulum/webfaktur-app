"use client";

import { useActionState } from "react";

import { Wortmarke } from "@/components/marke/wortmarke";
import { ThemeUmschalter } from "@/components/theme-umschalter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { anmelden, type Anmeldezustand } from "./actions";

const startzustand: Anmeldezustand = {};

export default function Anmeldeseite() {
  const [zustand, aktion, laeuft] = useActionState(anmelden, startzustand);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex justify-end p-4">
        <ThemeUmschalter />
      </div>

      <main className="auftauchen mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 pb-24">
        <Wortmarke className="mb-10 h-6 w-auto self-start" />

        <h1 className="text-2xl font-semibold tracking-tight">Anmelden</h1>
        <p className="mt-2 mb-8 text-sm text-muted-foreground">
          Zugang zu deinem Webfaktur-Bereich.
        </p>

        <form action={aktion} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className="h-11"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="passwort">Passwort</Label>
            <Input
              id="passwort"
              name="passwort"
              type="password"
              autoComplete="current-password"
              className="h-11"
              required
            />
          </div>

          {zustand.fehler ? (
            <p
              role="alert"
              className="auftauchen text-sm font-medium text-destructive"
            >
              {zustand.fehler}
            </p>
          ) : null}

          <Button
            type="submit"
            className="h-11 w-full transition-all"
            disabled={laeuft}
          >
            {laeuft ? "Wird geprüft …" : "Anmelden"}
          </Button>
        </form>
      </main>
    </div>
  );
}
