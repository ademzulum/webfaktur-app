import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { centFuerEingabe } from "@/lib/geld";
import { holeAngemeldetenNutzer } from "@/lib/nutzer";
import { createClient } from "@/lib/supabase/server";

import { betriebAktualisieren } from "../actions";
import { BetriebFormular } from "../betrieb-formular";

type Datensatz = {
  id: string;
  name: string;
  telefon: string | null;
  google_ads_kundennummer: string | null;
  paket: string;
  aktiv: boolean;
  wert_klein_cent: number;
  wert_mittel_cent: number;
  wert_gross_cent: number;
};

export default async function BetriebBearbeiten({
  params,
}: PageProps<"/dashboard/betriebe/[id]">) {
  const nutzer = await holeAngemeldetenNutzer();
  if (!nutzer) redirect("/login");
  if (nutzer.rolle !== "admin") redirect("/dashboard");

  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("betriebe")
    .select(
      "id, name, telefon, google_ads_kundennummer, paket, aktiv, wert_klein_cent, wert_mittel_cent, wert_gross_cent",
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const betrieb = data as Datensatz;

  // Die Aktion braucht die id. Sie hier fest zu binden ist sicherer, als sie
  // im Formular mitzuschicken - von dort käme sie aus dem Browser und wäre
  // manipulierbar.
  const aktualisieren = betriebAktualisieren.bind(null, betrieb.id);

  return (
    <main className="auftauchen mx-auto w-full max-w-2xl flex-1 px-5 py-10 sm:px-6 sm:py-16">
      <Link
        href="/dashboard/betriebe"
        className="mb-6 inline-flex items-center gap-1 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Alle Betriebe
      </Link>
      {/* Untereinander, nicht nebeneinander.
          Vorher standen beide in einer Zeile mit Abstand dazwischen - bei
          einem kurzen Firmennamen rutschte der Verweis dadurch an den
          rechten Rand und stand weit weg von dem, worauf er sich bezieht.
          Wo er landet, hing also von der Länge des Namens ab. */}
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {betrieb.name}
        </h1>
        <Link
          href={`/dashboard/betriebe/${betrieb.id}/zugaenge`}
          className="weich inline-flex items-center gap-1 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Zugänge verwalten
          <ChevronRight className="size-4" />
        </Link>
      </div>
      <BetriebFormular
        aktion={aktualisieren}
        knopfbeschriftung="Änderungen speichern"
        knopfkurz="Speichern"
        betrieb={{
          id: betrieb.id,
          name: betrieb.name,
          telefon: betrieb.telefon,
          google_ads_kundennummer: betrieb.google_ads_kundennummer,
          paket: betrieb.paket,
          aktiv: betrieb.aktiv,
          wert_klein: centFuerEingabe(betrieb.wert_klein_cent),
          wert_mittel: centFuerEingabe(betrieb.wert_mittel_cent),
          wert_gross: centFuerEingabe(betrieb.wert_gross_cent),
        }}
      />
    </main>
  );
}
