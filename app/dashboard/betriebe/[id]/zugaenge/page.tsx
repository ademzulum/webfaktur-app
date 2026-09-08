import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

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

import { betriebsnutzerAnlegen, betriebsnutzerEntfernen } from "./actions";
import { ZugangFormular } from "./zugang-formular";
import { ZugangLoeschen } from "./zugang-loeschen";

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
  if (zeilen.length > 0) {
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
  }

  return (
    <main className="auftauchen mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-6 sm:py-16">
      <Link
        href="/dashboard/betriebe"
        className="mb-6 inline-flex items-center gap-1 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Alle Betriebe
      </Link>

      <header className="mb-10 space-y-2">
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          {betrieb.name}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Zugänge</h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          Wer sich hiermit anmeldet, sieht ausschließlich die Anrufe dieses
          Betriebs. Dafür sorgen die Zugriffsregeln der Datenbank, nicht die
          Anwendung.
        </p>
      </header>

      <section className="mb-12">
        <h2 className="mb-3 text-xs tracking-wide text-muted-foreground uppercase">
          Vorhandene Zugänge
        </h2>

        {zeilen.length === 0 ? (
          <p className="rounded-lg border border-dashed bg-card/50 px-5 py-8 text-center text-sm text-muted-foreground">
            Noch kein Zugang für diesen Betrieb.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-Mail</TableHead>
                  <TableHead className="hidden sm:table-cell">Name</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Angelegt
                  </TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {zeilen.map((zeile) => (
                  <TableRow key={zeile.id}>
                    <TableCell className="font-mono text-xs break-all">
                      {emails.get(zeile.id) ?? "—"}
                      {/* Am Handy fehlen die eigenen Spalten - der Name
                          rutscht deshalb unter die Adresse. */}
                      {zeile.name ? (
                        <span className="block text-muted-foreground sm:hidden">
                          {zeile.name}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {zeile.name ?? "—"}
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs whitespace-nowrap text-muted-foreground md:table-cell">
                      {new Date(zeile.angelegt_am).toLocaleDateString("de-AT")}
                    </TableCell>
                    <TableCell className="text-right">
                      <ZugangLoeschen
                        aktion={betriebsnutzerEntfernen.bind(
                          null,
                          betrieb.id,
                          zeile.id,
                        )}
                      />
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

      <section className="rounded-lg border bg-card p-5 sm:p-6">
        <h2 className="mb-1 text-xs tracking-wide text-muted-foreground uppercase">
          Neuen Zugang anlegen
        </h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Das Passwort wird erzeugt und danach einmalig angezeigt.
        </p>
        <ZugangFormular aktion={betriebsnutzerAnlegen.bind(null, betrieb.id)} />
      </section>
    </main>
  );
}
