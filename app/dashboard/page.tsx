import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { centAlsEuro } from "@/lib/geld";
import { holeAngemeldetenNutzer } from "@/lib/nutzer";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Kachel mit einer Zahl.
 *
 * Bewusst KEIN Schatten beim Überfahren: Auf dem fast schwarzen Hintergrund
 * ist ein Schatten unsichtbar. Sichtbar sind Rahmenfarbe und Flächenhelligkeit,
 * und zwar in beiden Ansichten.
 */
function Kennzahlkachel({
  titel,
  wert,
  zusatz,
  pfad,
}: {
  titel: string;
  wert: string;
  zusatz: string;
  pfad: string;
}) {
  return (
    <Link
      href={pfad}
      className="group flex flex-col justify-between gap-6 rounded-lg border bg-card p-5 transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-muted/40 focus-visible:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          {titel}
        </p>
        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-[color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <div>
        <p className="font-mono text-3xl font-medium tabular-nums sm:text-4xl">
          {wert}
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">{zusatz}</p>
      </div>
    </Link>
  );
}

export default async function Dashboard() {
  const nutzer = await holeAngemeldetenNutzer();
  if (!nutzer) redirect("/login");

  const supabase = await createClient();

  // Nur Zählungen, keine Zeilen. "head: true" holt ausschließlich die Anzahl.
  // Welche Zeilen mitgezählt werden, entscheiden weiterhin die Zugriffsregeln.
  const [anrufeZahl, bewertungenZahl, betriebeZahl, werte] = await Promise.all([
    supabase.from("anrufe").select("*", { count: "exact", head: true }),
    supabase.from("bewertungen").select("*", { count: "exact", head: true }),
    supabase.from("betriebe").select("*", { count: "exact", head: true }),
    supabase.from("bewertungen").select("wert_cent"),
  ]);

  const anrufe = anrufeZahl.count ?? 0;
  const bewertungen = bewertungenZahl.count ?? 0;
  const betriebe = betriebeZahl.count ?? 0;

  // Pro Anruf gibt es höchstens eine Bewertung, deshalb ist die Differenz
  // genau die Zahl der noch offenen.
  const offen = Math.max(0, anrufe - bewertungen);

  const summe = ((werte.data ?? []) as { wert_cent: number }[]).reduce(
    (s, z) => s + z.wert_cent,
    0,
  );

  return (
    <main className="auftauchen mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-10 space-y-3 sm:mb-12">
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          {nutzer.rolle === "admin" ? "Agenturinhaber" : "Betrieb"}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Übersicht
        </h1>
        <p className="max-w-prose text-muted-foreground">
          {nutzer.rolle === "admin"
            ? "Alle Betriebe und deren Anrufe."
            : "Ausschließlich die Daten deines Betriebs."}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Kennzahlkachel
          titel="Anrufe"
          wert={String(anrufe)}
          zusatz="insgesamt erfasst"
          pfad="/dashboard/anrufe"
        />
        <Kennzahlkachel
          titel="Offen"
          wert={String(offen)}
          zusatz={
            offen === 0 ? "alles bewertet" : "warten auf eine Bewertung"
          }
          pfad="/dashboard/anrufe"
        />
        <Kennzahlkachel
          titel="Auftragswert"
          wert={centAlsEuro(summe)}
          zusatz="aus allen Bewertungen"
          pfad="/dashboard/anrufe"
        />

        {nutzer.rolle === "admin" ? (
          <Kennzahlkachel
            titel="Betriebe"
            wert={String(betriebe)}
            zusatz="angelegt und betreut"
            pfad="/dashboard/betriebe"
          />
        ) : null}
      </section>

      {nutzer.rolle !== "admin" ? (
        <p className="mt-10 text-sm text-muted-foreground">
          Fragen zu deinem Zugang oder zu den Wertstufen? Wende dich an
          Webfaktur.
        </p>
      ) : null}
    </main>
  );
}
