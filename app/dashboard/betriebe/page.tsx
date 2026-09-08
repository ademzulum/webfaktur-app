import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
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

function Wertstufe({ titel, cent }: { titel: string; cent: number }) {
  return (
    <div>
      <p className="font-mono text-[0.65rem] tracking-wide text-muted-foreground uppercase">
        {titel}
      </p>
      <p className="mt-0.5 font-mono text-sm tabular-nums">
        {centAlsEuro(cent)}
      </p>
    </div>
  );
}

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
    <main className="auftauchen mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
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
        <div className="rounded-xl border border-dashed bg-card/50 p-12 text-center">
          <p className="font-medium">Noch kein Betrieb angelegt.</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Jeder Anruf gehört später genau einem Betrieb. Ohne mindestens
            einen Betrieb kann kein Anruf gespeichert werden.
          </p>
        </div>
      ) : (
        <div className="auftauchen-gestaffelt grid gap-4 lg:grid-cols-2">
          {betriebe.map((betrieb, i) => (
            <article
              key={betrieb.id}
              style={{ "--verzoegerung": Math.min(i, 12) } as React.CSSProperties}
              className="weich flex flex-col gap-5 rounded-xl border bg-card p-5 hover:-translate-y-0.5 hover:border-primary/40 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-xl font-medium tracking-tight">
                    {betrieb.name}
                  </h2>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {betrieb.paket}
                    {betrieb.telefon ? <> &middot; {betrieb.telefon}</> : null}
                  </p>
                </div>

                <span
                  className={
                    "shrink-0 rounded-full px-2.5 py-1 font-mono text-[0.7rem] " +
                    (betrieb.aktiv
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground")
                  }
                >
                  {betrieb.aktiv ? "aktiv" : "stillgelegt"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 border-y border-border py-4">
                <Wertstufe titel="Klein" cent={betrieb.wert_klein_cent} />
                <Wertstufe titel="Mittel" cent={betrieb.wert_mittel_cent} />
                <Wertstufe titel="Groß" cent={betrieb.wert_gross_cent} />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <Link href={`/dashboard/betriebe/${betrieb.id}`} />
                  }
                >
                  Bearbeiten
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  render={
                    <Link href={`/dashboard/betriebe/${betrieb.id}/zugaenge`} />
                  }
                >
                  Zugänge
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
