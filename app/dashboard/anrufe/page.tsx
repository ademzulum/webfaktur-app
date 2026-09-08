import { redirect } from "next/navigation";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { centAlsEuro } from "@/lib/geld";
import { holeAngemeldetenNutzer } from "@/lib/nutzer";
import { einzelwert } from "@/lib/postgrest";
import { createClient } from "@/lib/supabase/server";

import { KampagnenDiagramm, type Kampagnenwert } from "./kampagnen-diagramm";

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

const BESCHRIFTUNG: Record<Bewertung["ergebnis"], string> = {
  kein_auftrag: "Kein Auftrag",
  klein: "Klein",
  mittel: "Mittel",
  gross: "Groß",
};

function Kennzahl({
  titel,
  wert,
  zusatz,
}: {
  titel: string;
  wert: string;
  zusatz?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground transition-colors hover:border-primary/30 sm:p-5">
      <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
        {titel}
      </p>
      <p className="mt-2 font-mono text-2xl font-medium tabular-nums sm:text-3xl">
        {wert}
      </p>
      {zusatz ? (
        <p className="mt-1 text-xs text-muted-foreground">{zusatz}</p>
      ) : null}
    </div>
  );
}

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
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kennzahl titel="Anrufe" wert={String(anrufe.length)} />
            <Kennzahl
              titel="Bewertet"
              wert={String(bewertet.length)}
              zusatz={`${anteil(bewertet.length, anrufe.length)} der Anrufe`}
            />
            <Kennzahl
              titel="Aufträge"
              wert={String(auftraege.length)}
              zusatz={`${anteil(auftraege.length, bewertet.length)} der Bewertungen`}
            />
            <Kennzahl titel="Auftragswert" wert={centAlsEuro(wertSumme)} />
          </section>

          {kampagnendaten.length > 0 ? (
            <section className="rounded-lg border bg-card p-5 text-card-foreground">
              <h2 className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
                Auftragswert je Kampagne
              </h2>
              <p className="mt-1 mb-4 text-xs text-muted-foreground">
                Summe der bewerteten Aufträge. Zum Überfahren für die Anzahl
                der Anrufe.
              </p>
              <KampagnenDiagramm daten={kampagnendaten} />
            </section>
          ) : null}

          <section className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zeitpunkt</TableHead>
                  {nutzer.rolle === "admin" ? (
                    <TableHead>Betrieb</TableHead>
                  ) : null}
                  <TableHead className="hidden sm:table-cell">Anrufer</TableHead>
                  <TableHead className="hidden md:table-cell">Kampagne</TableHead>
                  <TableHead className="hidden lg:table-cell">Keyword</TableHead>
                  <TableHead>Bewertung</TableHead>
                  <TableHead className="text-right">Wert</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anrufe.slice(0, 50).map((anruf) => {
                  const bewertung = bewertungVon(anruf);
                  const betrieb = einzelwert(anruf.betriebe);
                  return (
                    <TableRow key={anruf.id} className="transition-colors hover:bg-muted/40">
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {new Date(anruf.beginn).toLocaleString("de-AT", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {/* Am Handy fehlen eigene Spalten - Kampagne
                            rutscht deshalb unter den Zeitpunkt. */}
                        <span className="mt-1 block text-muted-foreground md:hidden">
                          {anruf.kampagne ?? "—"}
                        </span>
                      </TableCell>
                      {nutzer.rolle === "admin" ? (
                        <TableCell>{betrieb?.name ?? "—"}</TableCell>
                      ) : null}
                      <TableCell className="hidden font-mono text-xs whitespace-nowrap sm:table-cell">
                        {anruf.anrufer_nummer ?? "unbekannt"}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {anruf.kampagne ?? "—"}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">
                        {anruf.keyword ?? "—"}
                      </TableCell>
                      <TableCell>
                        {bewertung ? (
                          BESCHRIFTUNG[bewertung.ergebnis]
                        ) : (
                          <span className="text-muted-foreground">
                            offen
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">
                        {bewertung ? centAlsEuro(bewertung.wert_cent) : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </section>
        </div>
      )}
    </main>
  );
}
