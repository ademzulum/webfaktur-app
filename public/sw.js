/*
 * Der Hintergrunddienst ("Service Worker").
 *
 * Er sitzt zwischen der Seite und dem Netz und darf Antworten speichern.
 * Genau deshalb ist er heikel: Was er speichert, liegt auf dem Telefon und
 * bleibt dort auch nach dem Abmelden.
 *
 * Diese Fassung speichert deshalb AUSSCHLIESSLICH unveränderliche Dateien -
 * Programmcode, Gestaltung, Symbole. Niemals Seiteninhalte, niemals
 * Antworten der Datenbank, niemals irgendetwas mit Anrufernummern oder
 * Auftragswerten darin. Anfragen an Supabase gehen ohnehin an eine andere
 * Adresse und werden hier gar nicht erst angefasst.
 *
 * Nach einer Änderung an dieser Datei die Fassung hochzählen, sonst behalten
 * bereits installierte Telefone die alte.
 */
const FASSUNG = "webfaktur-v1";
const SPEICHER = `${FASSUNG}-statisch`;
const OHNEVERBINDUNG = "/offline";

self.addEventListener("install", (ereignis) => {
  ereignis.waitUntil(
    (async () => {
      try {
        const speicher = await caches.open(SPEICHER);
        // "reload" umgeht den Zwischenspeicher des Browsers - sonst könnte
        // hier eine veraltete Fassung der Seite abgelegt werden.
        await speicher.add(new Request(OHNEVERBINDUNG, { cache: "reload" }));
      } catch {
        // Klappt das nicht, soll die Installation trotzdem gelingen. Ohne
        // Ersatzseite fehlt nur der Hinweis, alles andere läuft weiter.
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (ereignis) => {
  ereignis.waitUntil(
    (async () => {
      // Speicher früherer Fassungen wegräumen.
      const namen = await caches.keys();
      await Promise.all(
        namen.filter((n) => !n.startsWith(FASSUNG)).map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (ereignis) => {
  const anfrage = ereignis.request;

  // Nur Abrufe, niemals Absendungen. Ein gespeichertes Absenden wäre ein
  // Fehler mit Folgen - etwa eine doppelt abgeschickte Bewertung.
  if (anfrage.method !== "GET") return;

  const adresse = new URL(anfrage.url);
  if (adresse.origin !== self.location.origin) return;

  // Seitenaufrufe: IMMER aus dem Netz, niemals speichern. Auf einer Seite
  // stehen die Daten genau eines Betriebs - die dürfen nicht auf einem
  // Telefon liegen bleiben. Ohne Verbindung kommt der Hinweis.
  if (anfrage.mode === "navigate") {
    ereignis.respondWith(
      (async () => {
        try {
          return await fetch(anfrage);
        } catch {
          const ersatz = await caches.match(OHNEVERBINDUNG);
          return ersatz ?? Response.error();
        }
      })(),
    );
    return;
  }

  // Alles andere nur, wenn es unveränderlich ist. Diese Dateien tragen einen
  // Namen, der sich bei jeder Änderung mitändert - eine gespeicherte Fassung
  // kann also nie veraltet sein.
  const unveraenderlich =
    adresse.pathname.startsWith("/_next/static/") ||
    adresse.pathname.startsWith("/symbol-");
  if (!unveraenderlich) return;

  ereignis.respondWith(
    (async () => {
      const speicher = await caches.open(SPEICHER);
      const gespeichert = await speicher.match(anfrage);
      if (gespeichert) return gespeichert;

      const antwort = await fetch(anfrage);
      if (antwort.ok) speicher.put(anfrage, antwort.clone());
      return antwort;
    })(),
  );
});
