"use server";

import { redirect } from "next/navigation";

import { euroInCent } from "@/lib/geld";
import { createClient } from "@/lib/supabase/server";
import { tokenHash } from "@/lib/token";

/**
 * Nimmt die Bewertung entgegen. Läuft ausschließlich auf dem Server.
 *
 * Die eigentliche Prüfung - gültig, nicht abgelaufen, noch nicht benutzt,
 * Betrag im erlaubten Rahmen - macht die Datenbank in bewertung_speichern().
 * Bewusst dort und nicht hier: So kann auch ein Fehler in dieser Datei keine
 * doppelte, verspätete oder unsinnig hohe Bewertung durchlassen.
 */
export async function bewertungAbgeben(formular: FormData) {
  const token = String(formular.get("token") ?? "");
  const ergebnis = String(formular.get("ergebnis") ?? "");

  if (!token) redirect("/bewerten/ungueltig");

  // Nur beim eigenen Betrag gibt es überhaupt eine Eingabe. Wird sie nicht
  // verstanden, kommt der Betrieb mit einem Hinweis zurück - statt dass
  // stillschweigend ein falscher Betrag gespeichert wird.
  let wertCent: number | null = null;
  if (ergebnis === "eigen") {
    wertCent = euroInCent(String(formular.get("wert") ?? ""));
    if (wertCent === null || wertCent <= 0) {
      redirect(`/bewerten/${token}?fehler=betrag`);
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("bewertung_speichern", {
    p_token_hash: tokenHash(token),
    p_ergebnis: ergebnis,
    p_wert_cent: wertCent,
  });

  if (error) redirect(`/bewerten/${token}?fehler=technik`);
  if (data === "gespeichert") redirect(`/bewerten/${token}/danke`);
  if (data === "ungueltiger_betrag") {
    redirect(`/bewerten/${token}?fehler=betrag`);
  }

  // abgelaufen, bereits_bewertet, unbekannt: zurück zur Seite, die den
  // passenden Hinweis von sich aus anzeigt.
  redirect(`/bewerten/${token}`);
}
