"use server";

import { revalidatePath } from "next/cache";

import { basisUrl } from "@/lib/basis-url";
import { holeAngemeldetenNutzer } from "@/lib/nutzer";
import { createClient } from "@/lib/supabase/server";
import { tokenErzeugen, tokenHash } from "@/lib/token";
import { smsSenden } from "@/lib/bird";

export type Versandzustand = { meldung?: string; ok?: boolean };

export async function bewertungssmsSenden(
  anrufId: string,
  _vorher: Versandzustand,
): Promise<Versandzustand> {
  const nutzer = await holeAngemeldetenNutzer();
  if (!nutzer || nutzer.rolle !== "admin") {
    return { ok: false, meldung: "Dafür fehlt dir die Berechtigung." };
  }

  // Der Klartext existiert nur hier im Arbeitsspeicher und wandert in die SMS.
  // In der Datenbank landet ausschließlich der Hash.
  const token = tokenErzeugen();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("bewertungslink_erzeugen", {
    p_anruf_id: anrufId,
    p_token_hash: tokenHash(token),
  });

  if (error) return { ok: false, meldung: error.message };

  const eintrag = (Array.isArray(data) ? data[0] : null) as {
    telefon: string | null;
    betrieb_name: string;
  } | null;

  if (!eintrag) return { ok: false, meldung: "Anruf nicht gefunden." };

  if (!eintrag.telefon) {
    return {
      ok: false,
      meldung: `Beim Betrieb "${eintrag.betrieb_name}" ist keine Mobilnummer hinterlegt.`,
    };
  }

  const link = `${basisUrl()}/bewerten/${token}`;
  const text =
    `${eintrag.betrieb_name}: Ist aus dem letzten Anruf ein Auftrag geworden? ` +
    `Bitte kurz bewerten: ${link}`;

  const ergebnis = await smsSenden(eintrag.telefon, text);

  if (!ergebnis.ok) {
    // Der Token bleibt bestehen, läuft aber nach 48 Stunden von selbst ab.
    // Ihn hier zu entfernen wäre eine weitere privilegierte Handlung - den
    // Aufwand ist es für einen fehlgeschlagenen Versand nicht wert.
    return { ok: false, meldung: `SMS nicht verschickt: ${ergebnis.grund}` };
  }

  revalidatePath("/dashboard/sms-test");
  return { ok: true, meldung: `SMS an ${eintrag.telefon} verschickt.` };
}
