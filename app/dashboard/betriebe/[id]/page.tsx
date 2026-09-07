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
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">
        {betrieb.name}
      </h1>
      <BetriebFormular
        aktion={aktualisieren}
        knopfbeschriftung="Änderungen speichern"
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
