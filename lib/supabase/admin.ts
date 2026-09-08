import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Verbindung mit dem GEHEIMEN Serverschlüssel.
 *
 * ACHTUNG - hier gelten andere Regeln als überall sonst im Projekt:
 *
 * Dieser Schlüssel umgeht sämtliche Zugriffsregeln der Datenbank. Alles, was
 * darüber läuft, darf alles. Die Prüfung "darf dieser Nutzer das?" kann die
 * Datenbank hier also NICHT übernehmen - sie muss vorher im Code passieren.
 *
 * Deshalb gilt für jeden Aufruf: erst holeAngemeldetenNutzer() und die Rolle
 * prüfen, dann erst diese Verbindung anfassen.
 *
 * Verwendet wird sie ausschließlich dort, wo es keinen anderen Weg gibt:
 * beim Anlegen von Anmeldekonten. Das kann nur die Verwaltungs-Schnittstelle
 * von Supabase, und die verlangt diesen Schlüssel.
 *
 * Der Schlüssel trägt bewusst KEIN NEXT_PUBLIC_ im Namen. Damit bleibt er auf
 * dem Server und gelangt nie in den Browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const geheim = process.env.SUPABASE_SECRET_KEY;

  if (!url || !geheim) {
    throw new Error(
      "SUPABASE_SECRET_KEY fehlt in .env.local. Ohne diesen Schlüssel lassen sich keine Anmeldekonten anlegen.",
    );
  }

  return createSupabaseClient(url, geheim, {
    auth: {
      // Diese Verbindung gehört keinem Menschen, sondern dem Server.
      // Sie soll keine Sitzung aufbauen und nichts zwischenspeichern.
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
