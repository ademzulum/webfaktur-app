import type { MetadataRoute } from "next";

/**
 * Das Manifest: die Angaben, die ein Telefon braucht, um Webfaktur wie eine
 * App auf den Startbildschirm zu legen.
 *
 * Next.js macht daraus beim Bauen die Datei /manifest.webmanifest und
 * verweist von jeder Seite darauf. Es muss nichts von Hand eingebunden
 * werden.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Webfaktur",
    short_name: "Webfaktur",
    description:
      "Anrufe aus Google Ads bewerten und als Auftragswert zurückmelden.",
    lang: "de-AT",

    // Wohin es beim Antippen geht. Wer nicht angemeldet ist, wird von dort
    // zur Anmeldung geschickt - das erledigt proxy.ts.
    start_url: "/dashboard",
    scope: "/",

    // "standalone" heißt: ohne Adressleiste und ohne Browserknöpfe. Es sieht
    // aus wie eine App, und deshalb muss die Navigation in der Kopfleiste
    // vollständig sein - einen Zurück-Knopf des Browsers gibt es dort nicht.
    display: "standalone",

    // Die Farben der dunklen Ansicht, weil dunkel die Voreinstellung ist.
    // background_color ist die Fläche, die beim Starten kurz zu sehen ist,
    // bevor die Seite geladen hat.
    background_color: "#0a0a0b",
    theme_color: "#0a0a0b",

    icons: [
      {
        src: "/symbol-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/symbol-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      // "maskable" heißt: Das System darf sich daraus seine eigene Form
      // schneiden - Kreis, Quadrat oder Tropfen, je nach Telefon. Deshalb
      // hat dieses Bild mehr Rand, damit vom Logo nichts abgeschnitten wird.
      {
        src: "/symbol-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
