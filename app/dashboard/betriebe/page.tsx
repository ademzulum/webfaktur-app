import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
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
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Zeile = {
  id: string;
  name: string;
  paket: string;
  aktiv: boolean;
  telefon: string | null;
  wert_klein_cent: number;
  wert_mittel_cent: number;
  wert_gross_cent: number;
};

export default async function BetriebeUebersicht() {
  const nutzer = await holeAngemeldetenNutzer();
  if (!nutzer) redirect("/login");
  if (nutzer.rolle !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("betriebe")
    .select(
      "id, name, paket, aktiv, telefon, wert_klein_cent, wert_mittel_cent, wert_gross_cent",
    )
    .order("name");

  const betriebe = (data ?? []) as Zeile[];

  return (
    <main className="auftauchen mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Betriebe</h1>
          <p className="font-mono text-xs text-muted-foreground">
            {betriebe.length === 1 ? "1 Betrieb" : `${betriebe.length} Betriebe`}
          </p>
        </div>
        <Button render={<Link href="/dashboard/betriebe/neu" />}>
          <Plus className="size-4" />
          Neuer Betrieb
        </Button>
      </header>

      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          Konnte nicht geladen werden: {error.message}
        </p>
      ) : betriebe.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card/50 p-10 text-center">
          <p className="font-medium">Noch kein Betrieb angelegt.</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Jeder Anruf gehört später genau einem Betrieb. Ohne mindestens
            einen Betrieb kann kein Anruf gespeichert werden.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Paket</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden text-right lg:table-cell">
                  Klein
                </TableHead>
                <TableHead className="hidden text-right lg:table-cell">
                  Mittel
                </TableHead>
                <TableHead className="hidden text-right lg:table-cell">
                  Groß
                </TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {betriebe.map((betrieb) => (
                <TableRow
                  key={betrieb.id}
                  className="transition-colors hover:bg-muted/40"
                >
                  <TableCell className="font-medium">
                    {betrieb.name}
                    {/* Am Handy fehlen die eigenen Spalten - Paket und
                        Status rutschen deshalb unter den Namen. */}
                    <span className="mt-1 block font-mono text-xs font-normal text-muted-foreground sm:hidden">
                      {betrieb.paket}
                      {" · "}
                      {betrieb.aktiv ? "aktiv" : "stillgelegt"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">
                    {betrieb.paket}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {betrieb.aktiv ? (
                      <span className="text-emerald-600 dark:text-emerald-500">
                        aktiv
                      </span>
                    ) : (
                      <span className="text-muted-foreground">stillgelegt</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-right font-mono text-xs tabular-nums lg:table-cell">
                    {centAlsEuro(betrieb.wert_klein_cent)}
                  </TableCell>
                  <TableCell className="hidden text-right font-mono text-xs tabular-nums lg:table-cell">
                    {centAlsEuro(betrieb.wert_mittel_cent)}
                  </TableCell>
                  <TableCell className="hidden text-right font-mono text-xs tabular-nums lg:table-cell">
                    {centAlsEuro(betrieb.wert_gross_cent)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      render={
                        <Link
                          href={`/dashboard/betriebe/${betrieb.id}/zugaenge`}
                        />
                      }
                    >
                      Zugänge
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      render={
                        <Link href={`/dashboard/betriebe/${betrieb.id}`} />
                      }
                    >
                      Bearbeiten
                    </Button>
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
