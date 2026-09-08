"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Auswahlreihe } from "@/components/ui/auswahlreihe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { type Kostenzustand } from "../actions";

const startzustand: Kostenzustand = {};

const PAKETE = [
  { wert: "basis", titel: "Basis" },
  { wert: "plus", titel: "Plus" },
  { wert: "premium", titel: "Premium" },
];

function Abschnitt({
  titel,
  hinweis,
  children,
}: {
  titel: string;
  hinweis?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-5 sm:p-6">
      <h2 className="text-xs tracking-wide text-muted-foreground uppercase">
        {titel}
      </h2>
      {hinweis ? (
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          {hinweis}
        </p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Geldfeld({
  id,
  titel,
  wert,
  hinweis,
}: {
  id: string;
  titel: string;
  wert: string;
  hinweis?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{titel}</Label>
      <div className="relative">
        <Input
          id={id}
          name={id}
          inputMode="decimal"
          defaultValue={wert}
          className="h-11 pr-9 text-right tabular-nums"
          required
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground"
        >
          €
        </span>
      </div>
      {hinweis ? (
        <p className="text-xs text-muted-foreground">{hinweis}</p>
      ) : null}
    </div>
  );
}

export function PreisFormular({
  aktion,
  paket,
  verkaufspreis,
  matelso,
  vertragsbeginn,
  mindestlaufzeit,
}: {
  aktion: (
    zustand: Kostenzustand,
    formular: FormData,
  ) => Promise<Kostenzustand>;
  paket: string;
  verkaufspreis: string;
  matelso: string;
  vertragsbeginn: string;
  mindestlaufzeit: number;
}) {
  const [zustand, absenden, laeuft] = useActionState(aktion, startzustand);

  const pakete = PAKETE.some((p) => p.wert === paket)
    ? PAKETE
    : [...PAKETE, { wert: paket, titel: paket }];

  return (
    <form action={absenden} className="space-y-4">
      <Abschnitt titel="Paket und Preis">
        <div className="space-y-5">
          <Auswahlreihe name="paket" optionen={pakete} gewaehlt={paket} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Geldfeld
              id="verkaufspreis"
              titel="Verkaufspreis monatlich"
              wert={verkaufspreis}
              hinweis="Was der Betrieb dir im Monat zahlt."
            />
            <Geldfeld
              id="matelso"
              titel="matelso-Kosten monatlich"
              wert={matelso}
              hinweis="Geschätzt. Es gibt derzeit keinen Vertrag."
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Die SMS-Kosten kommen automatisch dazu und werden nicht hier
            eingetragen: Sie hängen an der Anzahl der Anrufe und sind für alle
            Betriebe gleich.
          </p>
        </div>
      </Abschnitt>

      <Abschnitt
        titel="Vertrag"
        hinweis="Nach der Mindestlaufzeit verlängert sich der Vertrag monatlich. Gekündigt werden muss vor Beginn des nächsten Abrechnungszeitraums."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="vertragsbeginn">Vertragsbeginn</Label>
            <Input
              id="vertragsbeginn"
              name="vertragsbeginn"
              type="date"
              defaultValue={vertragsbeginn}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Leer lassen, solange das Datum nicht feststeht.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mindestlaufzeit">Mindestlaufzeit in Monaten</Label>
            <Input
              id="mindestlaufzeit"
              name="mindestlaufzeit"
              type="number"
              min={0}
              max={120}
              defaultValue={mindestlaufzeit}
              className="h-11 text-right tabular-nums"
              required
            />
          </div>
        </div>
      </Abschnitt>

      {zustand.fehler ? (
        <p
          role="alert"
          className="auftauchen rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm font-medium text-destructive"
        >
          {zustand.fehler}
        </p>
      ) : null}

      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={laeuft}
          className="h-11 flex-1 shrink px-4 sm:h-12 sm:flex-none sm:px-6 sm:text-base"
        >
          {laeuft ? "Wird gespeichert …" : "Speichern"}
        </Button>
        <Button
          variant="secondary"
          className="h-11 flex-1 shrink px-4 sm:h-12 sm:flex-none sm:px-6 sm:text-base"
          render={<Link href="/dashboard/kosten" />}
        >
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
