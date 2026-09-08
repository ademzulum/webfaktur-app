import { CheckCircle2, Clock, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { centAlsEuro } from "@/lib/geld";
import { createClient } from "@/lib/supabase/server";
import { tokenHash } from "@/lib/token";

import { bewertungAbgeben } from "./actions";

export const dynamic = "force-dynamic";

type Daten = {
  status: "gueltig" | "abgelaufen" | "bereits_bewertet";
  betrieb_name: string;
  anrufer_nummer: string | null;
  beginn: string;
  dauer_sekunden: number | null;
  wert_klein_cent: number;
  wert_mittel_cent: number;
  wert_gross_cent: number;
};

function dauerLesbar(sekunden: number | null): string {
  if (sekunden === null) return "unbekannte Dauer";
  const min = Math.floor(sekunden / 60);
  const sek = sekunden % 60;
  if (min === 0) return `${sek} Sekunden`;
  return `${min} Min ${String(sek).padStart(2, "0")} Sek`;
}

function Hinweis({
  symbol,
  titel,
  text,
}: {
  symbol: React.ReactNode;
  titel: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-6 text-center">
      <div className="flex justify-center">{symbol}</div>
      <h1 className="mt-4 text-xl font-semibold tracking-tight">{titel}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export default async function Bewertungsseite({
  params,
}: PageProps<"/bewerten/[token]">) {
  const { token } = await params;

  const supabase = await createClient();
  const { data } = await supabase.rpc("bewertung_daten", {
    p_token_hash: tokenHash(token),
  });

  const eintrag = (Array.isArray(data) ? data[0] : null) as Daten | null;

  const rahmen =
    "auftauchen mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10 sm:py-16";

  if (!eintrag) {
    return (
      <main className={rahmen}>
        <Hinweis
          symbol={<XCircle className="size-10 text-destructive" />}
          titel="Link ungültig"
          text="Dieser Bewertungslink gehört zu keinem Anruf. Bitte prüfe, ob die Adresse vollständig aus der SMS übernommen wurde."
        />
      </main>
    );
  }

  if (eintrag.status === "abgelaufen") {
    return (
      <main className={rahmen}>
        <Hinweis
          symbol={<Clock className="size-10 text-muted-foreground" />}
          titel="Link abgelaufen"
          text="Bewertungslinks gelten 48 Stunden. Dieser Anruf lässt sich nicht mehr bewerten."
        />
      </main>
    );
  }

  if (eintrag.status === "bereits_bewertet") {
    return (
      <main className={rahmen}>
        <Hinweis
          symbol={
            <CheckCircle2 className="size-10 text-emerald-600 dark:text-emerald-500" />
          }
          titel="Bereits bewertet"
          text="Dieser Anruf wurde schon bewertet. Vielen Dank - es ist nichts weiter zu tun."
        />
      </main>
    );
  }

  const stufen = [
    { wert: "kein_auftrag", beschriftung: "Kein Auftrag", betrag: null },
    {
      wert: "klein",
      beschriftung: "Kleiner Auftrag",
      betrag: eintrag.wert_klein_cent,
    },
    {
      wert: "mittel",
      beschriftung: "Mittlerer Auftrag",
      betrag: eintrag.wert_mittel_cent,
    },
    {
      wert: "gross",
      beschriftung: "Großer Auftrag",
      betrag: eintrag.wert_gross_cent,
    },
  ] as const;

  const zeitpunkt = new Date(eintrag.beginn).toLocaleString("de-AT", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className={rahmen}>
      <header className="mb-8 space-y-3 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          {eintrag.betrieb_name}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          Ist aus diesem Anruf ein Auftrag geworden?
        </h1>
        <div className="rounded-lg border bg-card px-4 py-3 text-sm">
          <p className="font-mono font-medium">
            {eintrag.anrufer_nummer ?? "Nummer unbekannt"}
          </p>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            {zeitpunkt} Uhr · {dauerLesbar(eintrag.dauer_sekunden)}
          </p>
        </div>
      </header>

      <div className="space-y-3">
        {stufen.map((stufe) => (
          <form key={stufe.wert} action={bewertungAbgeben}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="ergebnis" value={stufe.wert} />
            <Button
              type="submit"
              variant={stufe.wert === "kein_auftrag" ? "outline" : "default"}
              className="h-16 w-full justify-between px-5 text-base transition-transform duration-150 active:scale-[0.98]"
            >
              <span>{stufe.beschriftung}</span>
              {stufe.betrag !== null ? (
                <span className="font-mono text-sm tabular-nums opacity-80">
                  ca. {centAlsEuro(stufe.betrag)}
                </span>
              ) : null}
            </Button>
          </form>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Ein Tippen genügt. Die Angabe hilft, deine Werbung auf Aufträge statt
        auf Klicks auszurichten.
      </p>
    </main>
  );
}
