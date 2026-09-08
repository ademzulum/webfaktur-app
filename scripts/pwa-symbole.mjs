/**
 * Erzeugt die Symbole für den Startbildschirm aus app/icon.svg.
 *
 * Warum ein Skript und keine von Hand angelegten Bilder: So bleiben alle
 * Größen automatisch gleich, und wenn sich das Logo ändert, genügt ein
 * Aufruf statt vier Bildbearbeitungen.
 *
 *   node scripts/pwa-symbole.mjs
 *
 * Erzeugt:
 *   public/symbol-192.png            Android, kleine Darstellung
 *   public/symbol-512.png            Android, große Darstellung
 *   public/symbol-maskable-512.png   Android, wenn das System die Form
 *                                    vorgibt (Kreis, Quadrat, Tropfen)
 *   app/apple-icon.png               iPhone und iPad
 */
import { mkdirSync, readFileSync } from "node:fs";

import sharp from "sharp";

const svg = readFileSync(new URL("../app/icon.svg", import.meta.url));

// Der Ordner fehlt, solange nichts darin liegt - Git speichert leere Ordner
// nicht. Deshalb hier anlegen, statt sich darauf zu verlassen.
mkdirSync("public", { recursive: true });

/** Hintergrund der Kachel. Entspricht --background der dunklen Ansicht. */
const HINTERGRUND = { r: 10, g: 10, b: 11, alpha: 1 };

/**
 * @param ziel    Dateipfad
 * @param kante   Kantenlänge in Pixeln
 * @param anteil  Wie viel der Kante das Logo einnimmt.
 *                Bei "maskable" bewusst kleiner: Das System darf bis zu
 *                20 Prozent am Rand wegschneiden, um seine eigene Form
 *                herzustellen. Was dort liegt, kann verschwinden.
 */
async function symbol(ziel, kante, anteil) {
  const marke = await sharp(svg, { density: 900 })
    .resize({ width: Math.round(kante * anteil), fit: "inside" })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: kante,
      height: kante,
      channels: 4,
      background: HINTERGRUND,
    },
  })
    .composite([{ input: marke, gravity: "center" }])
    .png()
    .toFile(ziel);

  console.log("erzeugt:", ziel);
}

await symbol("public/symbol-192.png", 192, 0.68);
await symbol("public/symbol-512.png", 512, 0.68);
await symbol("public/symbol-maskable-512.png", 512, 0.5);
await symbol("app/apple-icon.png", 180, 0.66);
