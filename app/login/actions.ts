"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type Anmeldezustand = { fehler?: string };

/**
 * Läuft auf dem Server, nicht im Browser. Das Passwort wird also
 * nie im Browser-Code verarbeitet.
 */
export async function anmelden(
  _vorherigerZustand: Anmeldezustand,
  formular: FormData,
): Promise<Anmeldezustand> {
  const email = String(formular.get("email") ?? "").trim();
  const passwort = String(formular.get("passwort") ?? "");

  if (!email || !passwort) {
    return { fehler: "Bitte E-Mail und Passwort eingeben." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: passwort,
  });

  if (error) {
    // Bewusst unspezifisch: Eine Meldung wie "Konto existiert nicht" würde
    // Fremden verraten, welche E-Mail-Adressen bei uns registriert sind.
    return { fehler: "E-Mail oder Passwort ist nicht korrekt." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function abmelden() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
