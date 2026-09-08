import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

import { Wortmarke } from "@/components/marke/wortmarke";
import { ThemeUmschalter } from "@/components/theme-umschalter";
import { Button } from "@/components/ui/button";
import { pruefeSupabaseVerbindung } from "@/lib/supabase/status";

// Sorgt dafür, dass die Prüfung bei jedem Seitenaufruf neu läuft
// und nicht einmalig beim Bauen festgeschrieben wird.
export const dynamic = "force-dynamic";

export default async function Startseite() {
  const verbindung = await pruefeSupabaseVerbindung();

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-5 sm:px-6">
        <Wortmarke className="h-5 w-auto sm:h-6" />
        <ThemeUmschalter />
      </header>

      <main className="auftauchen mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-10 px-5 py-12 sm:px-6 sm:py-20">
        <div className="space-y-4">
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
            Aus Anrufen werden messbare Aufträge.
          </h1>
          <p className="text-pretty text-base text-muted-foreground sm:text-lg">
            Anrufe über Google Ads werden erfasst, vom Betrieb in zwei Taps
            bewertet und als Umsatz an Google zurückgemeldet. So optimiert
            Google auf Aufträge statt auf Klicks.
          </p>
        </div>

        <section className="rounded-lg border bg-card p-5 text-card-foreground">
          <h2 className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Verbindung zur Datenbank
          </h2>
          <div className="mt-3 flex items-start gap-3">
            {verbindung.ok ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-500" />
            ) : (
              <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
            )}
            <div className="space-y-1">
              <p className="font-medium">
                {verbindung.ok
                  ? "Supabase antwortet"
                  : "Supabase antwortet nicht"}
              </p>
              <p className="text-sm text-muted-foreground">
                {verbindung.ok
                  ? "Adresse und Schlüssel wurden akzeptiert. Diese Prüfung läuft bei jedem Aufruf neu."
                  : verbindung.grund}
              </p>
            </div>
          </div>
        </section>

        <div>
          <Button className="h-11 px-6" render={<Link href="/login" />}>
            Anmelden
          </Button>
        </div>
      </main>
    </div>
  );
}
