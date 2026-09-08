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
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Betriebe</h1>
          <p className="text-sm text-muted-foreground">
            {betriebe.length === 1
              ? "1 Betrieb"
              : `${betriebe.length} Betriebe`}
          </p>
        </div>
        <Button render={<Link href="/dashboard/betriebe/neu" />}>
          Neuer Betrieb
        </Button>
      </header>

      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          Konnte nicht geladen werden: {error.message}
        </p>
      ) : betriebe.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="font-medium">Noch kein Betrieb angelegt.</p>
          <p className="mt-1 text-sm text-muted-foreground">
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
                <TableHead>Paket</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Klein</TableHead>
                <TableHead className="text-right">Mittel</TableHead>
                <TableHead className="text-right">Groß</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {betriebe.map((betrieb) => (
                <TableRow key={betrieb.id}>
                  <TableCell className="font-medium">{betrieb.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {betrieb.paket}
                  </TableCell>
                  <TableCell>
                    {betrieb.aktiv ? (
                      <span className="text-emerald-600 dark:text-emerald-500">
                        aktiv
                      </span>
                    ) : (
                      <span className="text-muted-foreground">stillgelegt</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {centAlsEuro(betrieb.wert_klein_cent)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {centAlsEuro(betrieb.wert_mittel_cent)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
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
