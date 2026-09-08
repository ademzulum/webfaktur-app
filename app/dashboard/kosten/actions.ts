"use server";

import { revalidatePath } from "next/cache";

import { euroInCent } from "@/lib/geld";
import { createClient } from "@/lib/supabase/server";

export type Kostenzustand = { fehler?: string };

/**
 * Alle Aktionen hier laufen über den normalen Zugang, NICHT über den
 * geheimen Serverschlüssel.
 *
 * Das ist wesentlich: Der Serverschlüssel umgeht sämtliche Zugriffsregeln.
 * Über den normalen Zugang gilt weiterhin, was in 0010_kosten.sql steht -
 * nur ein Admin kommt an diese Tabellen. Selbst wenn hier eine Prüfung
 * fehlte, käme ein Betriebsnutzer nicht durch.
 */

/** Zahlungsstatus eines Betriebs für einen Monat umschalten. */
export async function zahlungUmschalten(
  betriebId: string,
  monat: string,
  bezahlt: boolean,
) {
  const supabase = await createClient();

  const { error } = await supabase.from("zahlungen").upsert(
    {
      betrieb_id: betriebId,
      monat,
      status: bezahlt ? "bezahlt" : "offen",
      bezahlt_am: bezahlt ? new Date().toISOString() : null,
    },
    { onConflict: "betrieb_id,monat" },
  );

  // Kein stilles Scheitern: Wird der Fehler verschluckt, sieht der Schalter
  // umgelegt aus, und beim nächsten Laden steht er wieder auf dem alten Wert.
  if (error)
    throw new Error(`Zahlungsstatus nicht gespeichert: ${error.message}`);

  revalidatePath("/dashboard/kosten");
}

/** Preise und Vertragsdaten eines Betriebs speichern. */
export async function preiseSpeichern(
  betriebId: string,
  _vorher: Kostenzustand,
  formular: FormData,
): Promise<Kostenzustand> {
  const verkauf = euroInCent(String(formular.get("verkaufspreis") ?? ""));
  const matelso = euroInCent(String(formular.get("matelso") ?? ""));

  if (verkauf === null) return { fehler: "Verkaufspreis nicht verstanden." };
  if (matelso === null) return { fehler: "matelso-Kosten nicht verstanden." };

  const laufzeit = Number(formular.get("mindestlaufzeit") ?? 12);
  if (!Number.isInteger(laufzeit) || laufzeit < 0 || laufzeit > 120) {
    return {
      fehler: "Mindestlaufzeit muss zwischen 0 und 120 Monaten liegen.",
    };
  }

  // Ein leeres Datumsfeld ist kein Fehler, sondern "noch nicht bekannt".
  const beginnRoh = String(formular.get("vertragsbeginn") ?? "").trim();
  const beginn = beginnRoh === "" ? null : beginnRoh;

  const supabase = await createClient();
  const { error } = await supabase.from("preiskonfiguration").upsert(
    {
      betrieb_id: betriebId,
      paket: String(formular.get("paket") ?? "basis"),
      verkaufspreis_monatlich_cent: verkauf,
      matelso_kosten_geschaetzt_monatlich_cent: matelso,
      vertragsbeginn: beginn,
      mindestlaufzeit_monate: laufzeit,
      geaendert_am: new Date().toISOString(),
    },
    { onConflict: "betrieb_id" },
  );

  if (error) return { fehler: `Nicht gespeichert: ${error.message}` };

  revalidatePath("/dashboard/kosten");
  return {};
}
