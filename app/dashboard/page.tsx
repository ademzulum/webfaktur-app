import Link from "next/link";
import { redirect } from "next/navigation";

import { Kennzahlreihe } from "@/components/kennzahl";
import { centAlsEuro } from "@/lib/geld";
import { holeAngemeldetenNutzer } from "@/lib/nutzer";
import { einzelwert } from "@/lib/postgrest";
import { createClient } from "@/lib/supabase/server";

import { AnrufKarte, type Anrufdaten } from "./anrufe/anruf-karte";

export const dynamic = "force-dynamic";

type Bewertung = {
  ergebnis: "kein_auftrag" | "klein" | "mittel" | "gross";
  wert_cent: number;
};

type Anruf = {
  id: string;
  beginn: string;
  anrufer_nummer: string | null;
  dauer_sekunden: number | null;
  kampagne: string | null;
  keyword: string | null;
  betriebe: { name: string } | { name: string }[] | null;
  bewertungen: Bewertung | Bewertung[] | null;
};

export default async function Dashboard() {
  const nutzer = await holeAngemeldetenNutzer();
  if (!nutzer) redirect("/login");

  const supabase = await createClient();

  // Nur Zählungen, keine Zeilen. "head: true" holt ausschließlich die Anzahl.
  // Welche Zeilen mitgezählt werden, entscheiden weiterhin die Zugriffsregeln.
  const [anrufeZahl, bewertungenZahl, betriebeZahl, werte, letzte] =
    await Promise.all([
      supabase.from("anrufe").select("*", { count: "exact", head: true }),
      supabase.from("bewertungen").select("*", { count: "exact", head: true }),
      supabase.from("betriebe").select("*", { count: "exact", head: true }),
      supabase.from("bewertungen").select("wert_cent, ergebnis"),
      supabase
        .from("anrufe")
        .select(
          "id, beginn, anrufer_nummer, dauer_sekunden, kampagne, keyword, betriebe(name), bewertungen(ergebnis, wert_cent)",
        )
        .order("beginn", { ascending: false })
        .limit(4),
    ]);

  const anrufe = anrufeZahl.count ?? 0;
  const bewertungen = bewertungenZahl.count ?? 0;
  const betriebe = betriebeZahl.count ?? 0;

  // Pro Anruf gibt es höchstens eine Bewertung, deshalb ist die Differenz
  // genau die Zahl der noch offenen.
  const offen = Math.max(0, anrufe - bewertungen);

  const bewertungsliste = (werte.data ?? []) as {
    wert_cent: number;
    ergebnis: string;
  }[];
  const summe = bewertungsliste.reduce((s, z) => s + z.wert_cent, 0);
  const auftraege = bewertungsliste.filter(
    (z) => z.ergebnis !== "kein_auftrag",
  ).length;

  const letzteAnrufe = (letzte.data ?? []) as unknown as Anruf[];

  const quote =
    anrufe === 0 ? "—" : `${Math.round((bewertungen / anrufe) * 100)} %`;

  return (
    <main className="auftauchen mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-6 sm:py-16">
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

      <Kennzahlreihe
        kacheln={[
          {
            titel: "Anrufe",
            wert: String(anrufe),
            zusatz: "insgesamt erfasst",
            pfad: "/dashboard/anrufe",
          },
          {
            titel: "Offen",
            wert: String(offen),
            zusatz: offen === 0 ? "alles bewertet" : "warten auf Bewertung",
            pfad: "/dashboard/anrufe?zustand=offen",
            hervorgehoben: offen > 0,
          },
          {
            titel: "Aufträge",
            wert: String(auftraege),
            zusatz: `Bewertungsquote ${quote}`,
            pfad: "/dashboard/anrufe?zustand=auftrag",
          },
          {
            titel: "Auftragswert",
            wert: centAlsEuro(summe),
            zusatz:
              nutzer.rolle === "admin"
                ? `über ${betriebe} ${betriebe === 1 ? "Betrieb" : "Betriebe"}`
                : "aus allen Bewertungen",
            pfad: "/dashboard/anrufe?zustand=auftrag",
          },
        ]}
      />

      {letzteAnrufe.length > 0 ? (
        <section className="mt-14">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
              Zuletzt eingegangen
            </h2>
            <Link
              href="/dashboard/anrufe"
              className="weich font-mono text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              alle ansehen
            </Link>
          </div>

          <div className="auftauchen-gestaffelt grid gap-4">
            {letzteAnrufe.map((anruf, i) => {
              const bewertung = einzelwert(anruf.bewertungen);
              const betrieb = einzelwert(anruf.betriebe);
              const daten: Anrufdaten = {
                id: anruf.id,
                beginn: anruf.beginn,
                anrufer_nummer: anruf.anrufer_nummer,
                dauer_sekunden: anruf.dauer_sekunden,
                kampagne: anruf.kampagne,
                keyword: anruf.keyword,
                betrieb:
                  nutzer.rolle === "admin" ? (betrieb?.name ?? null) : null,
                ergebnis: bewertung?.ergebnis ?? null,
                wert_cent: bewertung?.wert_cent ?? null,
              };
              return (
                <div
                  key={anruf.id}
                  style={{ "--verzoegerung": i + 4 } as React.CSSProperties}
                >
                  <AnrufKarte anruf={daten} />
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="mt-12 rounded-xl border border-dashed bg-card/50 p-12 text-center">
          <p className="font-medium">Noch keine Anrufe.</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Sobald matelso angebunden ist, erscheinen eingehende Anrufe hier
            innerhalb von Sekunden.
          </p>
        </section>
      )}
    </main>
  );
}
