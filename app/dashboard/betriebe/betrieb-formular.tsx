"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Auswahlreihe } from "@/components/ui/auswahlreihe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Schalter } from "@/components/ui/schalter";
import { paketTitel } from "@/lib/paket";

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

/** Die üblichen Pakete. */
const PAKETE = [
  { wert: "basis", titel: "Basis" },
  { wert: "plus", titel: "Plus" },
  { wert: "premium", titel: "Premium" },
];

/**
 * Ein Abschnitt der Maske.
 *
 * Die Überschrift steht bewusst in DM Mono, klein und versal - wie überall
 * sonst innerhalb einer Seite. Newsreader bleibt der Seitenüberschrift
 * vorbehalten, sonst gäbe es auf einer Seite zwei konkurrierende
 * Überschriftenstile.
 */
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

/**
 * Ein beschriftetes Feld, das sich in ein zweizeiliges Raster einfügt.
 *
 * "grid-rows-subgrid" heißt: Diese Spalte legt keine eigenen Zeilen an,
 * sondern benutzt die des übergeordneten Rasters. Dadurch liegen alle
 * Beschriftungen in derselben Zeile und alle Felder in derselben darunter -
 * unabhängig davon, ob eine Beschriftung einzeilig oder zweizeilig ist.
 */
function Feld({
  id,
  titel,
  children,
}: {
  id: string;
  titel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 sm:row-span-2 sm:grid-rows-subgrid">
      <Label htmlFor={id} className="self-end">
        {titel}
      </Label>
      {children}
    </div>
  );
}

/** Betragsfeld mit Eurozeichen im Feld statt in der Beschriftung. */
function Geldfeld({
  id,
  titel,
  wert,
}: {
  id: string;
  titel: string;
  wert: string;
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
    </div>
  );
}

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

  // Steht in der Datenbank ein Paket, das hier nicht aufgeführt ist, wird es
  // ergänzt statt stillschweigend überschrieben. Sonst würde das Speichern
  // einen vorhandenen Wert verlieren, nur weil die Auswahl ihn nicht kennt.
  const aktuellesPaket = betrieb?.paket ?? "basis";
  const pakete = PAKETE.some((p) => p.wert === aktuellesPaket)
    ? PAKETE
    : [...PAKETE, { wert: aktuellesPaket, titel: paketTitel(aktuellesPaket) }];

  return (
    <form action={absenden} className="space-y-4">
      <Abschnitt titel="Stammdaten">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name des Betriebs</Label>
            <Input
              id="name"
              name="name"
              defaultValue={betrieb?.name}
              placeholder="Dachdeckerei Muster GmbH"
              className="h-11"
              required
            />
          </div>

          {/* Zwei Spalten, deren Beschriftungen und Felder jeweils auf
              einer Höhe sitzen - auch wenn eine Beschriftung umbricht und
              die andere nicht. Das erledigt "subgrid": Beide Spalten
              benutzen dieselben zwei Zeilen des äußeren Rasters, statt
              jede für sich zu wachsen. */}
          <div className="grid gap-4 sm:grid-cols-2 sm:grid-rows-[auto_auto]">
            <Feld id="telefon" titel="Mobilnummer für die Bewertungs-SMS">
              <Input
                id="telefon"
                name="telefon"
                type="tel"
                defaultValue={betrieb?.telefon ?? ""}
                placeholder="+43 664 1234567"
                className="h-11"
              />
            </Feld>

            <Feld id="google_ads_kundennummer" titel="Google-Ads-Kundennummer">
              <Input
                id="google_ads_kundennummer"
                name="google_ads_kundennummer"
                defaultValue={betrieb?.google_ads_kundennummer ?? ""}
                placeholder="123-456-7890"
                className="h-11"
              />
            </Feld>
          </div>
        </div>
      </Abschnitt>

      <Abschnitt titel="Paket">
        <div className="space-y-4">
          <Auswahlreihe
            name="paket"
            optionen={pakete}
            gewaehlt={aktuellesPaket}
          />
          <Schalter
            name="aktiv"
            titel="Betrieb ist aktiv"
            hinweis="Stillgelegte Betriebe erhalten keine Bewertungs-SMS mehr. Ihre bisherigen Anrufe bleiben erhalten."
            voreingestellt={betrieb ? betrieb.aktiv : true}
          />
        </div>
      </Abschnitt>

      <Abschnitt
        titel="Wertstufen"
        hinweis="Was ein Auftrag dieser Größenordnung für diesen Betrieb ungefähr wert ist. Diese Beträge stehen später hinter den Schaltflächen der Bewertungsseite."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Geldfeld
            id="wert_klein"
            titel="Klein"
            wert={betrieb?.wert_klein ?? "250,00"}
          />
          <Geldfeld
            id="wert_mittel"
            titel="Mittel"
            wert={betrieb?.wert_mittel ?? "1.000,00"}
          />
          <Geldfeld
            id="wert_gross"
            titel="Groß"
            wert={betrieb?.wert_gross ?? "3.000,00"}
          />
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

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button type="submit" size="lg" disabled={laeuft}>
          {laeuft ? "Wird gespeichert …" : knopfbeschriftung}
        </Button>
        <Button
          variant="ghost"
          size="lg"
          render={<Link href="/dashboard/betriebe" />}
        >
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
