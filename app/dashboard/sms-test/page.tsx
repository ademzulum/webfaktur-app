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
  // Auf bewertungen.anruf_id liegt ein "unique": pro Anruf hoechstens eine
  // Bewertung. PostgREST erkennt das und liefert deshalb ein einzelnes
  // Objekt oder null - KEIN Array. Beide Formen werden hier abgefangen,
  // damit ein spaeterer Schemawechsel die Seite nicht umwirft.
  bewertungen: { id: string } | { id: string }[] | null;
};

function istBewertet(bewertungen: Anrufzeile["bewertungen"]): boolean {
  if (bewertungen === null) return false;
  if (Array.isArray(bewertungen)) return bewertungen.length > 0;
  return true;
}

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
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
      <header className="mb-8 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          SMS-Versand testen
        </h1>
        <p className="text-sm text-muted-foreground">
          Verschickt einen echten Bewertungslink an die beim Betrieb
          hinterlegte Mobilnummer. Solange matelso fehlt, ist das der einzige
          Auslöser — später übernimmt das der Webhook zwei Minuten nach
          Gesprächsende.
        </p>
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
                <TableHead>Betrieb</TableHead>
                <TableHead>Anrufer</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {anrufe.map((anruf) => (
                <TableRow key={anruf.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(anruf.beginn).toLocaleString("de-AT", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>{anruf.betriebe?.name ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {anruf.anrufer_nummer ?? "unbekannt"}
                  </TableCell>
                  <TableCell className="text-right">
                    <SmsKnopf
                      aktion={bewertungssmsSenden.bind(null, anruf.id)}
                      deaktiviert={
                        istBewertet(anruf.bewertungen)
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
