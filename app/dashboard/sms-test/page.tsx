import { redirect } from "next/navigation";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { holeAngemeldetenNutzer } from "@/lib/nutzer";
import { einzelwert } from "@/lib/postgrest";
import { createClient } from "@/lib/supabase/server";

import { bewertungssmsSenden } from "./actions";
import { SmsKnopf } from "./sms-knopf";

export const dynamic = "force-dynamic";

type Anrufzeile = {
  id: string;
  beginn: string;
  anrufer_nummer: string | null;
  matelso_id: string;
  betriebe: { name: string } | null;
  bewertungen: { id: string } | { id: string }[] | null;
};

export default async function SmsTest() {
  const nutzer = await holeAngemeldetenNutzer();
  if (!nutzer) redirect("/login");
  if (nutzer.rolle !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("anrufe")
    .select(
      "id, beginn, anrufer_nummer, matelso_id, betriebe(name), bewertungen(id)",
    )
    .order("beginn", { ascending: false })
    .limit(20);

  const anrufe = (data ?? []) as unknown as Anrufzeile[];

  return (
    <main className="auftauchen mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          SMS-Versand testen
        </h1>
        <p className="text-sm text-muted-foreground">
          Erzeugt einen echten Bewertungslink für einen Anruf. Solange matelso
          fehlt, ist das der einzige Auslöser — später übernimmt das der
          Webhook zwei Minuten nach Gesprächsende.
        </p>

        {process.env.SMS_TESTMODUS === "an" ? (
          <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm">
            <p className="font-medium">Testmodus aktiv</p>
            <p className="mt-1 text-muted-foreground">
              Es wird keine SMS verschickt. Der erzeugte Link erscheint
              stattdessen zum Anklicken. Token, Ablage und Gültigkeit sind
              dabei echt — nur der Versandweg entfällt. Abschalten über
              SMS_TESTMODUS in .env.local.
            </p>
          </div>
        ) : null}
      </header>

      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          Konnte nicht geladen werden: {error.message}
        </p>
      ) : anrufe.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="font-medium">Keine Anrufe vorhanden.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Lege mit supabase/testlink-erzeugen.sql einen Testanruf an.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zeitpunkt</TableHead>
                <TableHead className="hidden sm:table-cell">Betrieb</TableHead>
                <TableHead>Anrufer</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {anrufe.map((anruf) => (
                <TableRow key={anruf.id} className="transition-colors hover:bg-muted/40">
                  <TableCell className="font-mono text-xs whitespace-nowrap">
                    {new Date(anruf.beginn).toLocaleString("de-AT", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{anruf.betriebe?.name ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs whitespace-nowrap">
                    {anruf.anrufer_nummer ?? "unbekannt"}
                  </TableCell>
                  <TableCell className="text-right">
                    <SmsKnopf
                      aktion={bewertungssmsSenden.bind(null, anruf.id)}
                      deaktiviert={
                        einzelwert(anruf.bewertungen) !== null
                          ? "bereits bewertet"
                          : undefined
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </main>
  );
}
