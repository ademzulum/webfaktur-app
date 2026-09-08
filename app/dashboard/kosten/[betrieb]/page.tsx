import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { centFuerEingabe } from "@/lib/geld";
import { holeAngemeldetenNutzer } from "@/lib/nutzer";
import { createClient } from "@/lib/supabase/server";

import { preiseSpeichern } from "../actions";
import { PreisFormular } from "./preis-formular";

export const dynamic = "force-dynamic";

type Preiszeile = {
  paket: string;
  verkaufspreis_monatlich_cent: number;
  matelso_kosten_geschaetzt_monatlich_cent: number;
  vertragsbeginn: string | null;
  mindestlaufzeit_monate: number;
};

export default async function PreiseBearbeiten({
  params,
}: PageProps<"/dashboard/kosten/[betrieb]">) {
  const nutzer = await holeAngemeldetenNutzer();
  if (!nutzer) redirect("/login");
  if (nutzer.rolle !== "admin") redirect("/dashboard");

  const { betrieb: betriebId } = await params;
  const supabase = await createClient();

  const [betriebAntwort, preisAntwort] = await Promise.all([
    supabase
      .from("betriebe")
      .select("id, name")
      .eq("id", betriebId)
      .maybeSingle(),
    supabase
      .from("preiskonfiguration")
      .select(
        "paket, verkaufspreis_monatlich_cent, matelso_kosten_geschaetzt_monatlich_cent, vertragsbeginn, mindestlaufzeit_monate",
      )
      .eq("betrieb_id", betriebId)
      .maybeSingle(),
  ]);

  const betrieb = betriebAntwort.data as { id: string; name: string } | null;
  if (!betrieb) notFound();

  // Noch keine Zeile heißt: Für diesen Betrieb wurde noch nie ein Preis
  // eingetragen. Das ist kein Fehler, sondern der Normalfall beim ersten Mal.
  const preise = (preisAntwort.data ?? null) as Preiszeile | null;

  // Die Kennung wird hier fest gebunden, statt sie im Formular mitzuschicken.
  // Von dort käme sie aus dem Browser und wäre manipulierbar.
  const speichern = preiseSpeichern.bind(null, betrieb.id);

  return (
    <main className="auftauchen mx-auto w-full max-w-2xl flex-1 px-5 py-10 sm:px-6 sm:py-16">
      <Link
        href="/dashboard/kosten"
        className="weich mb-6 inline-flex items-center gap-1 rounded-md text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Kostenübersicht
      </Link>

      <div className="mb-8 space-y-2">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          Preise und Vertrag
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {betrieb.name}
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          Diese Angaben sieht ausschließlich der Agenturinhaber. Der Betrieb
          selbst bekommt sie über die Datenbank nicht zu sehen.
        </p>
      </div>

      <PreisFormular
        aktion={speichern}
        paket={preise?.paket ?? "basis"}
        verkaufspreis={centFuerEingabe(
          preise?.verkaufspreis_monatlich_cent ?? 0,
        )}
        matelso={centFuerEingabe(
          preise?.matelso_kosten_geschaetzt_monatlich_cent ?? 0,
        )}
        vertragsbeginn={preise?.vertragsbeginn ?? ""}
        mindestlaufzeit={preise?.mindestlaufzeit_monate ?? 12}
      />
    </main>
  );
}
