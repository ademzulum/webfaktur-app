export type SmsErgebnis =
  | { ok: true; id: string }
  | { ok: false; grund: string };

/**
 * Die Region steckt im Schlüssel selbst: bk_eu1_... oder bk_us1_...
 * Daraus die Adresse abzuleiten spart eine zweite Umgebungsvariable - und
 * verhindert, dass Schlüssel und Region versehentlich nicht zusammenpassen.
 */
function regionAusSchluessel(schluessel: string): string | null {
  const treffer = /^bk_(eu1|us1)_/.exec(schluessel);
  return treffer ? treffer[1] : null;
}

/**
 * Verschickt eine SMS über Bird.
 *
 * Spricht die Schnittstelle direkt an, ohne Zusatzpaket - dieselbe Bauweise
 * wie zuvor bei Twilio.
 *
 * Der Schlüssel steht ausschließlich in einer Umgebungsvariablen und wird
 * nirgends protokolliert. Ohne NEXT_PUBLIC_ davor bleibt er auf dem Server
 * und gelangt nie in den Browser.
 */
export async function smsSenden(an: string, text: string): Promise<SmsErgebnis> {
  const schluessel = process.env.BIRD_API_KEY;
  const absender = process.env.BIRD_ABSENDER;

  if (!schluessel || !absender) {
    return {
      ok: false,
      grund:
        "Bird ist nicht vollständig eingerichtet. Es fehlen Angaben in .env.local.",
    };
  }

  const region = regionAusSchluessel(schluessel);
  if (!region) {
    return {
      ok: false,
      grund: 'Der API-Schlüssel muss mit "bk_eu1_" oder "bk_us1_" beginnen.',
    };
  }

  let antwort: Response;
  try {
    antwort = await fetch(
      `https://${region}.platform.bird.com/v1/sms/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${schluessel}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: an,
          from: absender,
          text,
          // Kein Werbetext, sondern eine Nachricht zu einem konkreten
          // Vorgang. Die Einstufung entscheidet über Zustellwege und
          // Abmeldepflichten.
          category: "transactional",
        }),
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
    | { id?: string; status?: string; message?: string; code?: string }
    | null;

  if (!antwort.ok) {
    const meldung = daten?.message ?? `HTTP ${antwort.status}`;
    const code = daten?.code ? ` (Bird-Code ${daten.code})` : "";
    return { ok: false, grund: `${meldung}${code}` };
  }

  return { ok: true, id: daten?.id ?? "unbekannt" };
}
