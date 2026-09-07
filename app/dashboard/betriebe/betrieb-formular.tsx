"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { FormularZustand } from "./actions";

export type Betrieb = {
  id: string;
  name: string;
  telefon: string | null;
  google_ads_kundennummer: string | null;
  paket: string;
  aktiv: boolean;
  wert_klein: string;
  wert_mittel: string;
  wert_gross: string;
};

const startzustand: FormularZustand = {};

/**
 * Wird für "Neuer Betrieb" und "Betrieb bearbeiten" verwendet.
 * Der Unterschied steckt nur in der übergebenen Aktion.
 */
export function BetriebFormular({
  aktion,
  betrieb,
  knopfbeschriftung,
}: {
  aktion: (
    zustand: FormularZustand,
    formular: FormData,
  ) => Promise<FormularZustand>;
  betrieb?: Betrieb;
  knopfbeschriftung: string;
}) {
  const [zustand, absenden, laeuft] = useActionState(aktion, startzustand);

  return (
    <form action={absenden} className="space-y-8">
      <section className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name des Betriebs</Label>
          <Input
            id="name"
            name="name"
            defaultValue={betrieb?.name}
            placeholder="Dachdeckerei Muster GmbH"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="telefon">Mobilnummer für die Bewertungs-SMS</Label>
            <Input
              id="telefon"
              name="telefon"
              type="tel"
              defaultValue={betrieb?.telefon ?? ""}
              placeholder="+43 664 1234567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="google_ads_kundennummer">
              Google-Ads-Kundennummer
            </Label>
            <Input
              id="google_ads_kundennummer"
              name="google_ads_kundennummer"
              defaultValue={betrieb?.google_ads_kundennummer ?? ""}
              placeholder="123-456-7890"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="paket">Paket</Label>
            <Input
              id="paket"
              name="paket"
              defaultValue={betrieb?.paket ?? "basis"}
            />
          </div>

          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                name="aktiv"
                defaultChecked={betrieb ? betrieb.aktiv : true}
                className="size-4 accent-primary"
              />
              Betrieb ist aktiv
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-medium">Wertstufen</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Was ein Auftrag dieser Größenordnung für diesen Betrieb ungefähr
            wert ist. Diese Beträge stehen später hinter den vier
            Schaltflächen der Bewertungsseite. Eingabe in Euro.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="wert_klein">Kleiner Auftrag</Label>
            <Input
              id="wert_klein"
              name="wert_klein"
              inputMode="decimal"
              defaultValue={betrieb?.wert_klein ?? "250,00"}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wert_mittel">Mittlerer Auftrag</Label>
            <Input
              id="wert_mittel"
              name="wert_mittel"
              inputMode="decimal"
              defaultValue={betrieb?.wert_mittel ?? "1.000,00"}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wert_gross">Großer Auftrag</Label>
            <Input
              id="wert_gross"
              name="wert_gross"
              inputMode="decimal"
              defaultValue={betrieb?.wert_gross ?? "3.000,00"}
              required
            />
          </div>
        </div>
      </section>

      {zustand.fehler ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {zustand.fehler}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={laeuft}>
          {laeuft ? "Wird gespeichert …" : knopfbeschriftung}
        </Button>
        <Button variant="ghost" render={<Link href="/dashboard/betriebe" />}>
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
