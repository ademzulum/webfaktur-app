import { createClient } from "@/lib/supabase/server";

export type AngemeldeterNutzer = {
  id: string;
  rolle: "admin" | "betrieb";
  betrieb_id: string | null;
  name: string | null;
};

/**
 * Liefert die Zeile aus der nutzer-Tabelle zum angemeldeten Konto,
 * also Rolle und zugehörigen Betrieb.
 *
 * Gibt null zurück, wenn niemand angemeldet ist ODER wenn zum Konto keine
 * nutzer-Zeile existiert. Der zweite Fall ist Absicht: Ein Konto ohne
 * Zuordnung soll nichts sehen, statt versehentlich alles.
 */
export async function holeAngemeldetenNutzer(): Promise<AngemeldeterNutzer | null> {
  const supabase = await createClient();

  // Bewusst getClaims() statt getUser(): getUser() fragt bei jedem Aufruf
  // beim Supabase-Server nach, getClaims() prüft die Unterschrift des
  // Anmeldenachweises vor Ort. Da proxy.ts unmittelbar davor schon geprüft
  // hat, wären das sonst zwei Netzanfragen für dieselbe Auskunft.
  //
  // "sub" ist die Kennung des angemeldeten Kontos.
  const { data: nachweis } = await supabase.auth.getClaims();
  const kennung = nachweis?.claims?.sub;
  if (!kennung) return null;

  const { data } = await supabase
    .from("nutzer")
    .select("id, rolle, betrieb_id, name")
    .eq("id", kennung)
    .maybeSingle();

  return (data as AngemeldeterNutzer | null) ?? null;
}
