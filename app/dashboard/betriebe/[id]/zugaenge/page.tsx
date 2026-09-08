import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { holeAngemeldetenNutzer } from "@/lib/nutzer";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { betriebsnutzerAnlegen } from "./actions";
import { ZugangFormular } from "./zugang-formular";

export const dynamic = "force-dynamic";

export default async function Zugaenge({
  params,
}: PageProps<"/dashboard/betriebe/[id]/zugaenge">) {
  const angemeldet = await holeAngemeldetenNutzer();
  if (!angemeldet) redirect("/login");
  if (angemeldet.rolle !== "admin") redirect("/dashboard");

  const { id } = await params;

  const supabase = await createClient();
  const { data: betrieb } = await supabase
    .from("betriebe")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();

  if (!betrieb) notFound();

  // Die Zuordnungen liest die gewöhnliche Verbindung - die Zugriffsregeln
  // erlauben dem Admin das ohnehin.
  const { data: nutzerzeilen } = await supabase
    .from("nutzer")
    .select("id, name, angelegt_am")
    .eq("betrieb_id", id)
    .order("angelegt_am");

  const zeilen = (nutzerzeilen ?? []) as {
    id: string;
    name: string | null;
    angelegt_am: string;
  }[];

  // Die E-Mail steht nicht in unserer nutzer-Tabelle, sondern in der
  // Kontenverwaltung von Supabase. Nur der geheime Schlüssel kommt dort
  // heran - deshalb hier, und ausschließlich lesend.
  let emails = new Map<string, string>();
  let emailFehler: string | null = null;
  try {
    const admin = createAdminClient();
    const ergebnisse = await Promise.all(
      zeilen.map((z) => admin.auth.admin.getUserById(z.id)),
    );
    emails = new Map(
      ergebnisse
        .map((e) => e.data?.user)
        .filter((u): u is NonNullable<typeof u> => Boolean(u))
        .map((u) => [u.id, u.email ?? "—"]),
    );
  } catch (fehler) {
    emailFehler =
      fehler instanceof Error ? fehler.message : "Unbekannter Fehler";
  }

  const anlegen = betriebsnutzerAnlegen.bind(null, betrieb.id);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <header className="mb-8 space-y-2">
        <p className="text-sm text-muted-foreground">{betrieb.name}</p>
        <h1 className="text-2xl font-semibold tracking-tight">Zugänge</h1>
        <p className="text-sm text-muted-foreground">
          Wer sich hier anmeldet, sieht ausschließlich die Anrufe dieses
          Betriebs. Dafür sorgen die Zugriffsregeln der Datenbank, nicht die
          Anwendung.
        </p>
      </header>

      <section className="mb-10">
        {zeilen.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
            Noch kein Zugang für diesen Betrieb.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Angelegt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zeilen.map((zeile) => (
                  <TableRow key={zeile.id}>
                    <TableCell className="font-mono text-xs">
                      {emails.get(zeile.id) ?? "—"}
                    </TableCell>
                    <TableCell>{zeile.name ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {new Date(zeile.angelegt_am).toLocaleDateString("de-AT")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {emailFehler ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            E-Mail-Adressen konnten nicht geladen werden: {emailFehler}
          </p>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium">Neuen Zugang anlegen</h2>
        <ZugangFormular aktion={anlegen} />
      </section>

      <div className="mt-10">
        <Button
          variant="ghost"
          render={<Link href={`/dashboard/betriebe/${betrieb.id}`} />}
        >
          Zurück zum Betrieb
        </Button>
      </div>
    </main>
  );
}
