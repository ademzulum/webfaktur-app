"use client";

import { useActionState } from "react";

import { Wortmarke } from "@/components/marke/wortmarke";
import { ThemeUmschalter } from "@/components/theme-umschalter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { anmelden, type Anmeldezustand } from "./actions";

const startzustand: Anmeldezustand = {};

/**
 * Die Anmeldung ist zugleich die Startseite: Wer die Adresse aufruft,
 * landet hier. Deshalb steht die Wortmarke gross über dem Feld - es ist
 * das Erste, was man von Webfaktur sieht.
 */
export default function Anmeldeseite() {
  const [zustand, aktion, laeuft] = useActionState(anmelden, startzustand);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex justify-end p-4 sm:p-6">
        <ThemeUmschalter />
      </div>

      <main className="auftauchen mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 pb-24">
        {/* Nur die Wortmarke. Erklärender Text ist hier überflüssig - wer
            hier landet, weiß, wo er ist und was er tun soll.
            Die Überschrift bleibt trotzdem im Dokument, nur unsichtbar:
            Vorleseprogramme und Suchmaschinen brauchen sie, um die Seite
            benennen zu können. */}
        <div className="mb-12 flex justify-center">
          <Wortmarke className="h-11 w-auto sm:h-14" />
        </div>
        <h1 className="sr-only">Anmelden</h1>

        <form
          action={aktion}
          className="space-y-5 rounded-xl border bg-card p-6 sm:p-7"
        >
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

          <Button type="submit" size="lg" className="w-full" disabled={laeuft}>
            {laeuft ? "Wird geprüft …" : "Anmelden"}
          </Button>
        </form>
      </main>
    </div>
  );
}
