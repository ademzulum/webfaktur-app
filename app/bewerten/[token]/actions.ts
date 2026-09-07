"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { tokenHash } from "@/lib/token";

/**
 * Nimmt die Bewertung entgegen. Läuft ausschließlich auf dem Server.
 *
 * Die eigentliche Prüfung - gültig, nicht abgelaufen, noch nicht benutzt -
 * macht die Datenbank in bewertung_speichern(). Bewusst dort und nicht hier:
 * So kann auch ein Fehler in dieser Datei keine doppelte oder verspätete
 * Bewertung durchlassen.
 */
export async function bewertungAbgeben(formular: FormData) {
  const token = String(formular.get("token") ?? "");
  const ergebnis = String(formular.get("ergebnis") ?? "");

  if (!token) redirect("/bewerten/ungueltig");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("bewertung_speichern", {
    p_token_hash: tokenHash(token),
    p_ergebnis: ergebnis,
  });

  if (error) redirect(`/bewerten/${token}?fehler=1`);
  if (data === "gespeichert") redirect(`/bewerten/${token}/danke`);

  // abgelaufen, bereits_bewertet, unbekannt: zurück zur Seite, die den
  // passenden Hinweis von sich aus anzeigt.
  redirect(`/bewerten/${token}`);
}
