"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { euroInCent } from "@/lib/geld";
import { holeAngemeldetenNutzer } from "@/lib/nutzer";
import { createClient } from "@/lib/supabase/server";

export type FormularZustand = { fehler?: string };

type Betriebsfelder = {
  name: string;
  telefon: string | null;
  google_ads_kundennummer: string | null;
  paket: string;
  aktiv: boolean;
  wert_klein_cent: number;
  wert_mittel_cent: number;
  wert_gross_cent: number;
};

/**
 * Liest das Formular und prüft es, BEVOR die Datenbank gefragt wird.
 * Die Datenbank hat dieselben Regeln als Sicherheitsnetz - aber ihre
 * Fehlermeldungen sind für Menschen unlesbar.
 *
 * Gibt entweder die geprüften Felder oder einen Fehlertext zurück.
 */
function leseFelder(formular: FormData): Betriebsfelder | string {
  const name = String(formular.get("name") ?? "").trim();
  if (!name) return "Bitte einen Namen für den Betrieb angeben.";

  const stufen = [
    ["wert_klein", "Kleiner Auftrag"],
    ["wert_mittel", "Mittlerer Auftrag"],
    ["wert_gross", "Großer Auftrag"],
  ] as const;

  const werte: number[] = [];
  for (const [feld, bezeichnung] of stufen) {
    const cent = euroInCent(String(formular.get(feld) ?? ""));
    if (cent === null || cent <= 0) {
      return `${bezeichnung}: Bitte einen Betrag größer als null eingeben, zum Beispiel 250,00`;
    }
    werte.push(cent);
  }

  const [klein, mittel, gross] = werte;
  if (!(klein < mittel && mittel < gross)) {
    return "Die drei Beträge müssen aufsteigend sein: klein kleiner als mittel, mittel kleiner als groß.";
  }

  const leerZuNull = (wert: FormDataEntryValue | null) => {
    const text = String(wert ?? "").trim();
    return text === "" ? null : text;
  };

  return {
    name,
    telefon: leerZuNull(formular.get("telefon")),
    google_ads_kundennummer: leerZuNull(
      formular.get("google_ads_kundennummer"),
    ),
    paket: String(formular.get("paket") ?? "").trim() || "basis",
    aktiv: formular.get("aktiv") === "on",
    wert_klein_cent: klein,
    wert_mittel_cent: mittel,
    wert_gross_cent: gross,
  };
}

async function nurAdmin(): Promise<string | null> {
  const nutzer = await holeAngemeldetenNutzer();
  if (!nutzer || nutzer.rolle !== "admin") {
    return "Dafür fehlt dir die Berechtigung.";
  }
  return null;
}

export async function betriebAnlegen(
  _vorher: FormularZustand,
  formular: FormData,
): Promise<FormularZustand> {
  const verweigert = await nurAdmin();
  if (verweigert) return { fehler: verweigert };

  const felder = leseFelder(formular);
  if (typeof felder === "string") return { fehler: felder };

  const supabase = await createClient();
  const { error } = await supabase.from("betriebe").insert(felder);

  if (error) return { fehler: `Speichern fehlgeschlagen: ${error.message}` };

  revalidatePath("/dashboard/betriebe");
  redirect("/dashboard/betriebe");
}

export async function betriebAktualisieren(
  id: string,
  _vorher: FormularZustand,
  formular: FormData,
): Promise<FormularZustand> {
  const verweigert = await nurAdmin();
  if (verweigert) return { fehler: verweigert };

  const felder = leseFelder(formular);
  if (typeof felder === "string") return { fehler: felder };

  const supabase = await createClient();
  const { error } = await supabase.from("betriebe").update(felder).eq("id", id);

  if (error) return { fehler: `Speichern fehlgeschlagen: ${error.message}` };

  revalidatePath("/dashboard/betriebe");
  redirect("/dashboard/betriebe");
}
