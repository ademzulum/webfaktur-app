import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { holeAngemeldetenNutzer } from "@/lib/nutzer";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function Kachel({
  titel,
  text,
  pfad,
}: {
  titel: string;
  text: string;
  pfad: string;
}) {
  return (
    <Link
      href={pfad}
      className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-medium tracking-tight">{titel}</h2>
        <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </Link>
  );
}

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Zweite Absicherung. Der Torwächter in proxy.ts fängt das normalerweise
  // schon ab - aber sich auf nur eine Sperre zu verlassen, ist fahrlässig.
  if (!user) redirect("/login");

  const nutzer = await holeAngemeldetenNutzer();

  return (
    <main className="auftauchen mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-10 space-y-3">
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          {nutzer?.rolle === "admin" ? "Agenturinhaber" : "Betrieb"}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Übersicht
        </h1>
        <p className="max-w-prose text-muted-foreground">
          {nutzer?.rolle === "admin"
            ? "Du siehst alle Betriebe und deren Anrufe."
            : nutzer
              ? "Du siehst ausschließlich die Daten deines Betriebs."
              : "Diesem Konto ist noch keine Rolle zugeordnet. Es sieht deshalb keine Daten."}
        </p>
      </header>

      {nutzer ? (
        <section className="mb-12 grid gap-4 sm:grid-cols-2">
          <Kachel
            titel="Anrufe und Auswertung"
            text="Kennzahlen, Auftragswert je Kampagne und die letzten Anrufe."
            pfad="/dashboard/anrufe"
          />
          {nutzer.rolle === "admin" ? (
            <>
              <Kachel
                titel="Betriebe"
                text="Betriebe anlegen, Wertstufen pflegen, Zugänge vergeben."
                pfad="/dashboard/betriebe"
              />
              <Kachel
                titel="SMS-Versand testen"
                text="Bewertungslink für einen Anruf erzeugen."
                pfad="/dashboard/sms-test"
              />
            </>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-lg border bg-card p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-medium">Dein Konto</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex flex-wrap justify-between gap-2 border-b border-border pb-3">
            <dt className="text-muted-foreground">E-Mail</dt>
            <dd className="font-mono text-xs break-all">{user.email}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2 border-b border-border pb-3">
            <dt className="text-muted-foreground">Rolle</dt>
            <dd className="font-medium">{nutzer?.rolle ?? "keine zugeordnet"}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted-foreground">Kennung</dt>
            <dd className="font-mono text-xs break-all">{user.id}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
