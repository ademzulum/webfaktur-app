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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("nutzer")
    .select("id, rolle, betrieb_id, name")
    .eq("id", user.id)
    .maybeSingle();

  return (data as AngemeldeterNutzer | null) ?? null;
}
