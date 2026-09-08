import { redirect } from "next/navigation";

import { Kennzahlreihe } from "@/components/kennzahl";
import { Kategoriewahl } from "@/components/ui/kategoriewahl";
import { Sortierwahl } from "@/components/ui/sortierwahl";
import { centAlsEuro } from "@/lib/geld";
import { holeAngemeldetenNutzer } from "@/lib/nutzer";
import { einzelwert } from "@/lib/postgrest";
import { createClient } from "@/lib/supabase/server";

import { AnrufKarte, type Anrufdaten } from "./anruf-karte";
import { KampagnenBalken, type Kampagnenwert } from "./kampagnen-balken";

export const dynamic = "force-dynamic";

/** Wie viele Anrufe in die Auswertung einfließen. */
const GRENZE = 200;

/** Wie viele Karten höchstens gezeigt werden. */
const KARTEN = 50;

const PFAD = "/dashboard/anrufe";

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

type Zustand = "alle" | "offen" | "auftrag" | "kein";
type Sortierung = "neu" | "wert" | "alt";

/**
 * Holt einen Wert aus der Adresse und lässt nur Erlaubtes durch.
 *
 * Wichtig: Was in der Adresse steht, kommt von außen und kann alles
 * enthalten. Deshalb wird nicht darauf vertraut, sondern gegen eine feste
 * Liste geprüft. Passt nichts, gilt die Voreinstellung.
 */
function nurErlaubt<T extends string>(
  roh: string | string[] | undefined,
  erlaubt: readonly T[],
  voreinstellung: T,
): T {
  const wert = Array.isArray(roh) ? roh[0] : roh;
  return erlaubt.includes(wert as T) ? (wert as T) : voreinstellung;
}

export default async function Anrufauswertung({
  searchParams,
}: PageProps<"/dashboard/anrufe">) {
  const nutzer = await holeAngemeldetenNutzer();
  if (!nutzer) redirect("/login");

  const felder = await searchParams;
  const zustand = nurErlaubt<Zustand>(
    felder.zustand,
    ["alle", "offen", "auftrag", "kein"],
    "alle",
  );
  const sortierung = nurErlaubt<Sortierung>(
    felder.sortierung,
    ["neu", "wert", "alt"],
    "neu",
  );

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
  const ohneAuftrag = bewertet.length - auftraege.length;
  const offen = anrufe.length - bewertet.length;
  const wertSumme = bewertet.reduce(
    (summe, a) => summe + bewertungVon(a)!.wert_cent,
    0,
  );

  const anteil = (teil: number, ganzes: number) =>
    ganzes === 0 ? "—" : `${Math.round((teil / ganzes) * 100)} %`;

  // Auftragswert je Kampagne, absteigend, höchstens acht Balken.
  // Bewusst über ALLE Anrufe, nicht über die gefilterten: Die Auswertung
  // soll sich nicht mitverschieben, wenn man unten die Liste einschränkt.
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

  // --- Liste filtern und sortieren -------------------------------------
  const passt = (a: Anruf) => {
    const b = bewertungVon(a);
    if (zustand === "offen") return b === null;
    if (zustand === "auftrag")
      return b !== null && b.ergebnis !== "kein_auftrag";
    if (zustand === "kein") return b !== null && b.ergebnis === "kein_auftrag";
    return true;
  };

  const wertVon = (a: Anruf) => bewertungVon(a)?.wert_cent ?? -1;

  const gefiltert = anrufe.filter(passt);
  const sortiert = [...gefiltert].sort((a, b) => {
    if (sortierung === "wert") return wertVon(b) - wertVon(a);
    const zeitA = new Date(a.beginn).getTime();
    const zeitB = new Date(b.beginn).getTime();
    return sortierung === "alt" ? zeitA - zeitB : zeitB - zeitA;
  });

  const sichtbar = sortiert.slice(0, KARTEN);

  return (
    <main className="auftauchen mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-6 sm:py-16">
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
        <div className="rounded-xl border border-dashed bg-card/50 p-12 text-center">
          <p className="font-medium">Noch keine Anrufe vorhanden.</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Mit supabase/testdaten-anrufe.sql lässt sich ein Satz Testanrufe
            anlegen, um die Auswertung zu sehen.
          </p>
        </div>
      ) : (
        <div className="space-y-12 sm:space-y-14">
          <Kennzahlreihe
            kacheln={[
              {
                titel: "Anrufe",
                wert: String(anrufe.length),
                zusatz: offen === 0 ? "alle bewertet" : `${offen} noch offen`,
              },
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
              {
                titel: "Auftragswert",
                wert: centAlsEuro(wertSumme),
                // BEWUSST NICHT der Durchschnitt je Auftrag. Der würde aus
                // den Wertstufen berechnet, die der Betrieb selbst
                // eingestellt hat - jeder große Auftrag ist bei ihm exakt
                // derselbe Betrag. Der Durchschnitt saehe nach Messung aus,
                // waere aber nur eine Mischung aus drei selbst gesetzten
                // Zahlen, noch dazu groschengenau. Die Anzahl dagegen
                // stimmt.
                zusatz:
                  auftraege.length === 0
                    ? "noch kein Auftrag"
                    : `aus ${auftraege.length} ${auftraege.length === 1 ? "Auftrag" : "Aufträgen"}`,
              },
            ]}
          />

          {kampagnendaten.length > 0 ? (
            <section className="rounded-xl border bg-card p-5 text-card-foreground sm:p-6">
              <h2 className="text-xs tracking-wide text-muted-foreground uppercase">
                Auftragswert je Kampagne
              </h2>
              <p className="mt-1 mb-6 text-xs text-muted-foreground">
                Die volle Breite ist der gesamte Auftragswert. Jeder Balken
                zeigt, welchen Anteil daran eine Kampagne hat.
              </p>
              <KampagnenBalken daten={kampagnendaten} />
            </section>
          ) : null}

          <section>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-border pb-4">
              <Kategoriewahl
                pfad={PFAD}
                parameter="zustand"
                aktuell={zustand}
                weitere={{ sortierung }}
                beschriftung="Anrufe einschränken"
                optionen={[
                  { wert: "alle", titel: "Alle", anzahl: anrufe.length },
                  { wert: "offen", titel: "Offen", anzahl: offen },
                  {
                    wert: "auftrag",
                    titel: "Aufträge",
                    anzahl: auftraege.length,
                  },
                  { wert: "kein", titel: "Kein Auftrag", anzahl: ohneAuftrag },
                ]}
              />

              <Sortierwahl
                pfad={PFAD}
                parameter="sortierung"
                aktuell={sortierung}
                weitere={{ zustand }}
                optionen={[
                  { wert: "neu", titel: "Neueste" },
                  { wert: "alt", titel: "Älteste" },
                  { wert: "wert", titel: "Höchster Wert" },
                ]}
              />
            </div>

            {/* Der Schlüssel enthält die gewählte Auswahl.
                Ändert sie sich, wirft React die alten Karten weg und baut
                neue - dadurch läuft die Einblendung erneut. Ohne das würde
                React dieselben Karten behalten und nur ihren Inhalt
                austauschen: Die Liste würde schlagartig umspringen, ohne
                jede Bewegung. */}
            {sichtbar.length === 0 ? (
              <p
                key={`leer-${zustand}`}
                className="auftauchen rounded-xl border border-dashed bg-card/50 px-5 py-10 text-center text-sm text-muted-foreground"
              >
                Kein Anruf in dieser Auswahl.
              </p>
            ) : (
              <div
                key={`${zustand}-${sortierung}`}
                className="auftauchen-gestaffelt grid gap-4"
              >
                {sichtbar.map((anruf, i) => {
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
            )}

            {sortiert.length > KARTEN ? (
              <p className="mt-4 text-center text-xs text-muted-foreground">
                {sichtbar.length} von {sortiert.length} Anrufen gezeigt.
              </p>
            ) : null}
          </section>
        </div>
      )}
    </main>
  );
}
