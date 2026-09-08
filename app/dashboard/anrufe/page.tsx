import { redirect } from "next/navigation";

import { centAlsEuro } from "@/lib/geld";
import { holeAngemeldetenNutzer } from "@/lib/nutzer";
import { einzelwert } from "@/lib/postgrest";
import { createClient } from "@/lib/supabase/server";

import { Kennzahlkachel } from "@/components/kennzahl";

import { AnrufKarte, type Anrufdaten } from "./anruf-karte";
import { KampagnenBalken, type Kampagnenwert } from "./kampagnen-balken";

export const dynamic = "force-dynamic";

/** Wie viele Anrufe in die Auswertung einfließen. */
const GRENZE = 200;

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

export default async function Anrufauswertung() {
  const nutzer = await holeAngemeldetenNutzer();
  if (!nutzer) redirect("/login");

  const supabase = await createClient();

  // Kein Filter auf den eigenen Betrieb: Das erledigen die Zugriffsregeln in
  // der Datenbank. Ein Betriebsnutzer bekommt hier von sich aus nur die
  // eigenen Zeilen, der Admin alle - ohne eine Zeile Code dafür.
  const { data, error } = await supabase
    .from("anrufe")
    .select(
      "id, beginn, anrufer_nummer, dauer_sekunden, kampagne, keyword, betriebe(name), bewertungen(ergebnis, wert_cent)",
    )
    .order("beginn", { ascending: false })
    .limit(GRENZE);

  const anrufe = (data ?? []) as unknown as Anruf[];

  const bewertungVon = (a: Anruf) => einzelwert(a.bewertungen);

  const bewertet = anrufe.filter((a) => bewertungVon(a) !== null);
  const auftraege = bewertet.filter(
    (a) => bewertungVon(a)!.ergebnis !== "kein_auftrag",
  );
  const wertSumme = bewertet.reduce(
    (summe, a) => summe + bewertungVon(a)!.wert_cent,
    0,
  );

  const anteil = (teil: number, ganzes: number) =>
    ganzes === 0 ? "—" : `${Math.round((teil / ganzes) * 100)} %`;

  // Auftragswert je Kampagne, absteigend, höchstens acht Balken.
  const jeKampagne = new Map<string, { cent: number; anrufe: number }>();
  for (const a of bewertet) {
    const name = a.kampagne?.trim() || "ohne Kampagne";
    const bisher = jeKampagne.get(name) ?? { cent: 0, anrufe: 0 };
    jeKampagne.set(name, {
      cent: bisher.cent + bewertungVon(a)!.wert_cent,
      anrufe: bisher.anrufe + 1,
    });
  }

  const kampagnendaten: Kampagnenwert[] = [...jeKampagne.entries()]
    .map(([name, w]) => ({ name, cent: w.cent, anrufe: w.anrufe }))
    .filter((k) => k.cent > 0)
    .sort((a, b) => b.cent - a.cent)
    .slice(0, 8);

  return (
    <main className="auftauchen mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Anrufe</h1>
        <p className="text-sm text-muted-foreground">
          {nutzer.rolle === "admin"
            ? "Alle Betriebe."
            : "Ausschließlich dein Betrieb."}{" "}
          Ausgewertet werden die letzten {GRENZE} Anrufe.
        </p>
      </header>

      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          Konnte nicht geladen werden: {error.message}
        </p>
      ) : anrufe.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="font-medium">Noch keine Anrufe vorhanden.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Mit supabase/testdaten-anrufe.sql lässt sich ein Satz Testanrufe
            anlegen, um die Auswertung zu sehen.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          <section className="auftauchen-gestaffelt grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { titel: "Anrufe", wert: String(anrufe.length) },
              {
                titel: "Bewertet",
                wert: String(bewertet.length),
                zusatz: `${anteil(bewertet.length, anrufe.length)} der Anrufe`,
              },
              {
                titel: "Aufträge",
                wert: String(auftraege.length),
                zusatz: `${anteil(auftraege.length, bewertet.length)} der Bewertungen`,
              },
              { titel: "Auftragswert", wert: centAlsEuro(wertSumme) },
            ].map((kachel, i) => (
              <div
                key={kachel.titel}
                style={{ "--verzoegerung": i } as React.CSSProperties}
              >
                <Kennzahlkachel {...kachel} />
              </div>
            ))}
          </section>

          {kampagnendaten.length > 0 ? (
            <section className="rounded-xl border bg-card p-5 text-card-foreground sm:p-6">
              <h2 className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
                Auftragswert je Kampagne
              </h2>
              <p className="mt-1 mb-6 text-xs text-muted-foreground">
                Summe der bewerteten Aufträge. Der längste Balken ist die
                stärkste Kampagne, alle anderen richten sich danach.
              </p>
              <KampagnenBalken daten={kampagnendaten} />
            </section>
          ) : null}

          <section>
            <h2 className="mb-4 font-mono text-xs tracking-wide text-muted-foreground uppercase">
              Letzte Anrufe
            </h2>
            <div className="auftauchen-gestaffelt grid gap-3">
              {anrufe.slice(0, 50).map((anruf, i) => {
                const bewertung = bewertungVon(anruf);
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
                    style={
                      {
                        "--verzoegerung": Math.min(i, 12),
                      } as React.CSSProperties
                    }
                  >
                    <AnrufKarte anruf={daten} />
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
