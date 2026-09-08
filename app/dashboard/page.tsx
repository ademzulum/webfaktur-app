import Link from "next/link";
import { redirect } from "next/navigation";

import { abmelden } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { holeAngemeldetenNutzer } from "@/lib/nutzer";
import { createClient } from "@/lib/supabase/server";

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
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-6 py-20">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Angemeldet</h1>
        <p className="text-muted-foreground">
          {nutzer?.rolle === "admin"
            ? "Du bist als Agenturinhaber angemeldet und siehst alle Betriebe."
            : nutzer
              ? "Du siehst ausschließlich die Daten deines Betriebs."
              : "Diesem Konto ist noch keine Rolle zugeordnet. Es sieht deshalb keine Daten."}
        </p>
      </header>

      <dl className="rounded-lg border bg-card p-5 text-card-foreground">
        <div className="flex flex-wrap justify-between gap-2 border-b py-2 first:pt-0">
          <dt className="text-sm text-muted-foreground">E-Mail</dt>
          <dd className="text-sm font-medium">{user.email}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-b py-2">
          <dt className="text-sm text-muted-foreground">Rolle</dt>
          <dd className="text-sm font-medium">
            {nutzer?.rolle ?? "keine zugeordnet"}
          </dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2 py-2 last:pb-0">
          <dt className="text-sm text-muted-foreground">Benutzerkennung</dt>
          <dd className="font-mono text-xs">{user.id}</dd>
        </div>
      </dl>

      {nutzer ? (
        <div className="flex flex-wrap gap-3">
          <Button render={<Link href="/dashboard/anrufe" />}>
            Anrufe und Auswertung
          </Button>
          {nutzer.rolle === "admin" ? (
            <>
              <Button
                variant="outline"
                render={<Link href="/dashboard/betriebe" />}
              >
                Betriebe verwalten
              </Button>
              <Button
                variant="outline"
                render={<Link href="/dashboard/sms-test" />}
              >
                SMS-Versand testen
              </Button>
            </>
          ) : null}
        </div>
      ) : null}

      <form action={abmelden}>
        <Button type="submit" variant="outline">
          Abmelden
        </Button>
      </form>
    </main>
  );
}
