import { Info, Pencil } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Kennzahlreihe } from "@/components/kennzahl";
import { centAlsEuro } from "@/lib/geld";
import { holeAngemeldetenNutzer } from "@/lib/nutzer";
import { paketTitel } from "@/lib/paket";
import { createClient } from "@/lib/supabase/server";

import { Verlaufsbalken, type Verlaufsmonat } from "./verlaufsbalken";
import { Zahlungsschalter } from "./zahlungsschalter";

export const dynamic = "force-dynamic";

type Zeile = {
  betrieb_id: string;
  betrieb_name: string;
  paket: string;
  verkaufspreis_cent: number;
  matelso_kosten_cent: number;
  anrufe_gesamt: number;
  bewertete_anrufe: number;
  sms_kosten_cent: number;
  marge_cent: number;
  marge_prozent: number | string | null;
  deckungsbeitrag_je_anruf_cent: number | null;
  zahlungsstatus: "offen" | "bezahlt";
  vertragsbeginn: string | null;
  mindestlaufzeit_monate: number;
  mindestlaufzeit_bis: string | null;
  naechste_kuendigung: string | null;
};

function datum(wert: string | null): string {
  if (!wert) return "—";
  return new Date(wert).toLocaleDateString("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function prozent(wert: number | string | null): string {
  if (wert === null) return "—";
  return `${Number(wert).toLocaleString("de-AT", { maximumFractionDigits: 1 })} %`;
}

export default async function Kostenuebersicht() {
  const nutzer = await holeAngemeldetenNutzer();
  if (!nutzer) redirect("/login");

  // Das Verstecken der Seite ist Bequemlichkeit, kein Schutz. Der Schutz
  // steht in der Datenbank: Ohne Admin-Rolle liefern die Abfragen unten
  // nichts zurück, ganz gleich, wer diese Seite aufruft.
  // Nachgewiesen mit supabase/kostenschutz-pruefen.sql.
  if (nutzer.rolle !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const [uebersicht, verlauf] = await Promise.all([
    supabase.rpc("kostenuebersicht"),
    supabase.rpc("kostenverlauf", { p_monate: 6 }),
  ]);

  const zeilen = (uebersicht.data ?? []) as Zeile[];
  const verlaufszeilen = (verlauf.data ?? []) as (Verlaufsmonat & {
    betrieb_id: string;
  })[];

  // Verlauf je Betrieb bündeln, damit die Tabelle unten nur noch nachsieht.
  const verlaufJeBetrieb = new Map<string, Verlaufsmonat[]>();
  for (const v of verlaufszeilen) {
    const bisher = verlaufJeBetrieb.get(v.betrieb_id) ?? [];
    bisher.push(v);
    verlaufJeBetrieb.set(v.betrieb_id, bisher);
  }

  const summe = zeilen.reduce(
    (s, z) => ({
      verkauf: s.verkauf + z.verkaufspreis_cent,
      matelso: s.matelso + z.matelso_kosten_cent,
      sms: s.sms + z.sms_kosten_cent,
      marge: s.marge + z.marge_cent,
      anrufe: s.anrufe + z.anrufe_gesamt,
      bewertet: s.bewertet + z.bewertete_anrufe,
    }),
    { verkauf: 0, matelso: 0, sms: 0, marge: 0, anrufe: 0, bewertet: 0 },
  );

  const summeProzent =
    summe.verkauf === 0 ? null : (summe.marge * 100) / summe.verkauf;
  const summeJeAnruf =
    summe.bewertet === 0 ? null : Math.round(summe.marge / summe.bewertet);

  const monatName = new Date().toLocaleDateString("de-AT", {
    month: "long",
    year: "numeric",
  });

  const fehler = uebersicht.error ?? verlauf.error;

  return (
    <main className="auftauchen mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-6 sm:py-16">
      <header className="mb-8 space-y-2">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          {monatName}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Kosten</h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          Verkaufspreise, Einkaufskosten und Marge je Betrieb. Diese Seite sieht
          ausschließlich der Agenturinhaber - dafür sorgen die Zugriffsregeln
          der Datenbank, nicht diese Seite.
        </p>
      </header>

      {fehler ? (
        <p
          role="alert"
          className="mb-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm font-medium text-destructive"
        >
          Konnte nicht geladen werden: {fehler.message}
        </p>
      ) : null}

      {/* Der Hinweis steht bewusst oben und nicht klein unter der Tabelle:
          Jede matelso-Zahl auf dieser Seite ist geschätzt, und wer die Marge
          liest, muss das vorher wissen und nicht hinterher. */}
      <p className="mb-8 flex items-start gap-3 rounded-xl border border-dashed bg-card/50 p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        <span>
          Die matelso-Kosten sind{" "}
          <strong>geschätzt, kein aktiver Vertrag</strong>. Jede Marge auf
          dieser Seite ist damit eine Annahme, keine Abrechnung.
        </span>
      </p>

      <Kennzahlreihe
        kacheln={[
          {
            titel: "Umsatz",
            wert: centAlsEuro(summe.verkauf),
            zusatz: `${zeilen.length} ${zeilen.length === 1 ? "Betrieb" : "Betriebe"}`,
          },
          {
            titel: "Kosten",
            wert: centAlsEuro(summe.matelso + summe.sms),
            zusatz: `davon ${centAlsEuro(summe.sms)} SMS`,
          },
          {
            titel: "Marge",
            wert: centAlsEuro(summe.marge),
            zusatz: prozent(summeProzent),
          },
          {
            titel: "Je Anruf",
            wert: summeJeAnruf === null ? "—" : centAlsEuro(summeJeAnruf),
            zusatz: `${summe.bewertet} bewertete Anrufe`,
          },
        ]}
      />

      {zeilen.length === 0 ? (
        <div className="mt-12 rounded-xl border border-dashed bg-card/50 p-12 text-center">
          <p className="font-medium">Noch kein Preis hinterlegt.</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Ein Betrieb erscheint hier, sobald für ihn ein Verkaufspreis
            eingetragen ist. Das geht über „Betriebe“ und dort bei jedem Eintrag
            über „Preise und Vertrag“.
          </p>
        </div>
      ) : (
        /* Eine echte Tabelle, weil hier Zahlen SPALTENWEISE verglichen
           werden - genau das, wofür eine Tabelle da ist. Auf schmalen
           Bildschirmen lässt sie sich in ihrem eigenen Rahmen schieben,
           statt die ganze Seite zu verbreitern. */
        <div className="mt-12 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[64rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium">Betrieb</th>
                <th className="px-4 py-3 text-right font-medium">Verkauf</th>
                <th className="px-4 py-3 text-right font-medium">
                  matelso
                  <span className="block text-[0.65rem] font-normal text-muted-foreground">
                    geschätzt
                  </span>
                </th>
                <th className="px-4 py-3 text-right font-medium">SMS</th>
                <th className="px-4 py-3 text-right font-medium">Marge</th>
                <th className="px-4 py-3 text-right font-medium">%</th>
                <th className="px-4 py-3 text-right font-medium">
                  DB
                  <span className="block text-[0.65rem] font-normal text-muted-foreground">
                    je Anruf
                  </span>
                </th>
                <th className="px-4 py-3 font-medium">6 Monate</th>
                <th className="px-4 py-3 font-medium">Zahlung</th>
                <th className="px-4 py-3 font-medium">Kündbar</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>

            <tbody>
              {zeilen.map((z) => (
                <tr
                  key={z.betrieb_id}
                  className="weich border-b border-border last:border-0 hover:bg-muted/20"
                >
                  <td className="px-4 py-3">
                    <span className="block">{z.betrieb_name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {paketTitel(z.paket)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {centAlsEuro(z.verkaufspreis_cent)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {centAlsEuro(z.matelso_kosten_cent)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {centAlsEuro(z.sms_kosten_cent)}
                    <span className="block text-xs">
                      {z.bewertete_anrufe} von {z.anrufe_gesamt}
                    </span>
                  </td>
                  <td
                    className={
                      "px-4 py-3 text-right tabular-nums " +
                      (z.marge_cent < 0
                        ? "text-destructive"
                        : "text-foreground")
                    }
                  >
                    {centAlsEuro(z.marge_cent)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {prozent(z.marge_prozent)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {z.deckungsbeitrag_je_anruf_cent === null
                      ? "—"
                      : centAlsEuro(z.deckungsbeitrag_je_anruf_cent)}
                  </td>
                  <td className="px-4 py-3">
                    <Verlaufsbalken
                      monate={verlaufJeBetrieb.get(z.betrieb_id) ?? []}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Zahlungsschalter
                      betriebId={z.betrieb_id}
                      monat={new Date().toISOString().slice(0, 8) + "01"}
                      bezahlt={z.zahlungsstatus === "bezahlt"}
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="block tabular-nums">
                      {datum(z.naechste_kuendigung)}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      seit {datum(z.vertragsbeginn)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/kosten/${z.betrieb_id}`}
                      aria-label={`Preise von ${z.betrieb_name} bearbeiten`}
                      className="weich inline-flex rounded-lg p-2 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
                    >
                      <Pencil className="size-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Die Summenzeile gehört in den Fuß, nicht als weitere Zeile in
                den Körper: Vorleseprogramme kündigen sie damit als
                Zusammenfassung an statt als weiteren Betrieb. */}
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/40">
                <td className="px-4 py-3 font-medium">Summe</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {centAlsEuro(summe.verkauf)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {centAlsEuro(summe.matelso)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {centAlsEuro(summe.sms)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {centAlsEuro(summe.marge)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {prozent(summeProzent)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {summeJeAnruf === null ? "—" : centAlsEuro(summeJeAnruf)}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {summe.anrufe} Anrufe
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </main>
  );
}
