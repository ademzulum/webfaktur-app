export type SmsErgebnis =
  | { ok: true; sid: string }
  | { ok: false; grund: string };

/**
 * Verschickt eine SMS über Twilio.
 *
 * Spricht die Schnittstelle direkt an, ohne Zusatzpaket. Angemeldet wird sich
 * mit einem API Key (SK...) statt mit dem Auth Token des Kontos: Ein API Key
 * lässt sich einzeln zurückziehen, ohne alles andere lahmzulegen. Der Auth
 * Token dagegen ist der Generalschlüssel zum ganzen Twilio-Konto.
 *
 * Die Zugangsdaten stehen ausschließlich in Umgebungsvariablen und werden
 * nirgends protokolliert.
 */
export async function smsSenden(an: string, text: string): Promise<SmsErgebnis> {
  const kontoSid = process.env.TWILIO_ACCOUNT_SID;
  const keySid = process.env.TWILIO_API_KEY_SID;
  const keyGeheimnis = process.env.TWILIO_API_KEY_SECRET;
  const absender = process.env.TWILIO_ABSENDER;

  if (!kontoSid || !keySid || !keyGeheimnis || !absender) {
    return {
      ok: false,
      grund:
        "Twilio ist nicht vollständig eingerichtet. Es fehlen Angaben in .env.local.",
    };
  }

  let antwort: Response;
  try {
    antwort = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${kontoSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${keySid}:${keyGeheimnis}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: an, From: absender, Body: text }),
        cache: "no-store",
      },
    );
  } catch (fehler) {
    return {
      ok: false,
      grund: fehler instanceof Error ? fehler.message : "Netzwerkfehler",
    };
  }

  const daten = (await antwort.json().catch(() => null)) as
    | { sid?: string; message?: string; code?: number }
    | null;

  if (!antwort.ok) {
    const meldung = daten?.message ?? `HTTP ${antwort.status}`;
    const code = daten?.code ? ` (Twilio-Code ${daten.code})` : "";
    return { ok: false, grund: `${meldung}${code}` };
  }

  return { ok: true, sid: daten?.sid ?? "unbekannt" };
}
