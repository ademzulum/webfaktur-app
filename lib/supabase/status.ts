type Verbindungsergebnis =
  | { ok: true }
  | { ok: false; grund: string };

/**
 * Fragt Supabase tatsächlich über das Netzwerk an, um zu belegen,
 * dass Adresse und Schlüssel stimmen. Reine Anzeige - wird später
 * durch echte Funktionen ersetzt.
 */
export async function pruefeSupabaseVerbindung(): Promise<Verbindungsergebnis> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return { ok: false, grund: "Umgebungsvariablen fehlen" };
  }

  try {
    const antwort = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key },
      cache: "no-store",
    });

    if (!antwort.ok) {
      return { ok: false, grund: `Supabase antwortete mit HTTP ${antwort.status}` };
    }

    return { ok: true };
  } catch (fehler) {
    return {
      ok: false,
      grund: fehler instanceof Error ? fehler.message : "Netzwerkfehler",
    };
  }
}
