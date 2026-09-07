import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { pruefeSupabaseVerbindung } from "@/lib/supabase/status";

// Sorgt dafür, dass die Prüfung bei jedem Seitenaufruf neu läuft
// und nicht einmalig beim Bauen festgeschrieben wird.
export const dynamic = "force-dynamic";

export default async function Startseite() {
  const verbindung = await pruefeSupabaseVerbindung();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-10 px-6 py-20">
      <header className="space-y-4">
        <p className="text-sm font-medium tracking-wide text-muted-foreground">
          Webfaktur
        </p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Rechnungen schreiben, ohne Umwege.
        </h1>
        <p className="text-pretty text-lg text-muted-foreground">
          Das Grundgerüst steht: Next.js, Tailwind, shadcn/ui und Supabase sind
          eingerichtet. Die Funktionen entstehen Schritt für Schritt.
        </p>
      </header>

      <section className="rounded-lg border bg-card p-5 text-card-foreground">
        <h2 className="text-sm font-medium text-muted-foreground">
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

      <div className="flex flex-wrap items-center gap-3">
        <Button render={<Link href="/login" />}>Anmelden</Button>
      </div>
    </main>
  );
}
