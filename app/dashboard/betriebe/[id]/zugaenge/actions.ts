"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";

import { holeAngemeldetenNutzer } from "@/lib/nutzer";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ZugangZustand = {
  fehler?: string;
  /** Nur direkt nach dem Anlegen gesetzt - wird genau einmal angezeigt. */
  zugangsdaten?: { email: string; passwort: string };
};

/**
 * Erzeugt ein Anfangspasswort.
 *
 * 12 Zufallsbytes aus dem kryptografischen Zufallsgenerator, als Text
 * dargestellt. Nicht erratbar und nicht aus einer Wortliste.
 */
function passwortErzeugen(): string {
  return randomBytes(12).toString("base64url");
}

export async function betriebsnutzerAnlegen(
  betriebId: string,
  _vorher: ZugangZustand,
  formular: FormData,
): Promise<ZugangZustand> {
  // Diese Prüfung ist hier ausnahmsweise die einzige Absicherung: Der
  // geheime Schlüssel weiter unten umgeht die Regeln der Datenbank, sie
  // kann also nicht für uns einspringen.
  const angemeldet = await holeAngemeldetenNutzer();
  if (!angemeldet || angemeldet.rolle !== "admin") {
    return { fehler: "Dafür fehlt dir die Berechtigung." };
  }

  const email = String(formular.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formular.get("name") ?? "").trim();

  if (!email || !email.includes("@")) {
    return { fehler: "Bitte eine gültige E-Mail-Adresse angeben." };
  }

  // Sicherheitsnetz: Der Betrieb muss existieren, sonst entstünde ein Konto
  // ohne Zuordnung - und das sähe später aus wie ein Fehler in den Regeln.
  //
  // Bewusst über die GEWOEHNLICHE Verbindung: Der Admin darf betriebe ohnehin
  // lesen, dafür braucht es den geheimen Schlüssel nicht. Je weniger über ihn
  // läuft, desto kleiner der Schaden, falls er je abhandenkommt.
  const supabase = await createClient();
  const { data: betrieb, error: lesefehler } = await supabase
    .from("betriebe")
    .select("id")
    .eq("id", betriebId)
    .maybeSingle();

  // Die Fehlermeldung MUSS durchgereicht werden. Sie hier zu verschlucken und
  // pauschal "nicht gefunden" zu melden, hat schon einmal eine halbe Stunde
  // Suche gekostet - der Betrieb existierte, nur der Zugriff scheiterte.
  if (lesefehler) {
    return {
      fehler: `Betrieb konnte nicht geprüft werden: ${lesefehler.message}`,
    };
  }
  if (!betrieb) return { fehler: "Betrieb nicht gefunden." };

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (fehler) {
    return {
      fehler: fehler instanceof Error ? fehler.message : "Unbekannter Fehler",
    };
  }

  const passwort = passwortErzeugen();

  const { data: neu, error: anlegefehler } = await admin.auth.admin.createUser({
    email,
    password: passwort,
    // Ohne diese Zeile wartete das Konto auf eine Bestätigungsmail. Der
    // Zugang wird hier aber bewusst vom Admin vergeben, nicht selbst
    // beantragt - eine Bestätigung ergäbe keinen Sinn.
    email_confirm: true,
  });

  if (anlegefehler || !neu?.user) {
    return {
      fehler: `Konto konnte nicht angelegt werden: ${anlegefehler?.message ?? "unbekannter Fehler"}`,
    };
  }

  const { error: zuordnungsfehler } = await admin.from("nutzer").insert({
    id: neu.user.id,
    betrieb_id: betriebId,
    rolle: "betrieb",
    name: name || null,
  });

  if (zuordnungsfehler) {
    // Das Anmeldekonto besteht schon, die Zuordnung fehlt. Ohne Aufräumen
    // bliebe ein Konto zurück, das sich anmelden kann, aber nichts sieht.
    await admin.auth.admin.deleteUser(neu.user.id);
    return {
      fehler: `Zuordnung fehlgeschlagen, Konto wurde wieder entfernt: ${zuordnungsfehler.message}`,
    };
  }

  revalidatePath(`/dashboard/betriebe/${betriebId}/zugaenge`);
  return { zugangsdaten: { email, passwort } };
}

export type LoeschZustand = { fehler?: string };

/**
 * Entfernt einen Zugang.
 *
 * Gelöscht wird das Anmeldekonto. Die Zeile in nutzer verschwindet dabei von
 * selbst mit, weil sie per "on delete cascade" daran hängt - deshalb braucht
 * die Serverrolle dafür kein Löschrecht auf der Tabelle.
 *
 * Zwei Schutzvorkehrungen:
 *   1. Der eigene Zugang lässt sich nicht entfernen. Sonst könnte man sich
 *      versehentlich selbst aussperren, und niemand käme mehr an die
 *      Verwaltung heran.
 *   2. Nur Zugänge mit der Rolle "betrieb" und nur solche, die wirklich zu
 *      diesem Betrieb gehören. Sonst liesse sich über eine veränderte
 *      Adresszeile ein fremder Zugang löschen.
 */
export async function betriebsnutzerEntfernen(
  betriebId: string,
  nutzerId: string,
  _vorher: LoeschZustand,
): Promise<LoeschZustand> {
  const angemeldet = await holeAngemeldetenNutzer();
  if (!angemeldet || angemeldet.rolle !== "admin") {
    return { fehler: "Dafür fehlt dir die Berechtigung." };
  }

  if (nutzerId === angemeldet.id) {
    return { fehler: "Der eigene Zugang lässt sich hier nicht entfernen." };
  }

  const supabase = await createClient();
  const { data: zeile, error: lesefehler } = await supabase
    .from("nutzer")
    .select("id, betrieb_id, rolle")
    .eq("id", nutzerId)
    .maybeSingle();

  if (lesefehler) {
    return {
      fehler: `Zugang konnte nicht geprüft werden: ${lesefehler.message}`,
    };
  }
  if (!zeile) return { fehler: "Zugang nicht gefunden." };
  if (zeile.betrieb_id !== betriebId || zeile.rolle !== "betrieb") {
    return { fehler: "Dieser Zugang gehört nicht zu diesem Betrieb." };
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (fehler) {
    return {
      fehler: fehler instanceof Error ? fehler.message : "Unbekannter Fehler",
    };
  }

  const { error: loeschfehler } = await admin.auth.admin.deleteUser(nutzerId);
  if (loeschfehler) {
    return { fehler: `Konnte nicht entfernt werden: ${loeschfehler.message}` };
  }

  revalidatePath(`/dashboard/betriebe/${betriebId}/zugaenge`);
  return {};
}
