// Erzeugt aus den SVG-Dateien in images/ die React-Komponenten in
// components/marke/.
//
// Aufruf aus dem Projektordner:   node scripts/logos-erzeugen.mjs
//
// Warum ein Skript und kein Handbetrieb: Die Pfaddaten eines Logos sind
// tausende Zeichen lang. Sie abzutippen ginge unweigerlich schief.
//
// Das Skript ersetzt die Farbklassen aus der SVG-Datei:
//   Schriftzug  -> currentColor    (nimmt die Textfarbe an, hell wie dunkel)
//   Bildmarke   -> Markenfarbe     (bleibt immer orange)

import { readFileSync, writeFileSync } from "node:fs";

function umwandeln(quelle, { name, brandKlasse, textKlasse, beschreibung }) {
  const roh = readFileSync(quelle, "utf8");

  const viewBox = /viewBox="([^"]+)"/.exec(roh)?.[1];
  if (!viewBox) throw new Error(`viewBox fehlt in ${quelle}`);

  // Alles innerhalb von <g id="Ebene_1-2"> ... </g>
  const inhalt = /<g id="Ebene_1-2">([\s\S]*?)<\/g>\s*<\/svg>/.exec(roh)?.[1];
  if (!inhalt) throw new Error(`Inhalt nicht gefunden in ${quelle}`);

  let pfade = inhalt;
  if (textKlasse) pfade = pfade.replaceAll(`class="${textKlasse}"`, 'fill="currentColor"');
  if (brandKlasse) pfade = pfade.replaceAll(`class="${brandKlasse}"`, 'fill="var(--color-marke, #ed570d)"');

  // "pathLength={1}" rechnet die Länge jedes Pfades auf 1 um.
  //
  // Gebraucht wird das für den Ladeschirm: Dort wird das Logo gezeichnet,
  // indem eine Strichlinie über den Pfad geschoben wird. Wie lang der Pfad
  // wirklich ist, kann CSS nicht ermitteln - mit dieser Angabe ist die Länge
  // immer 1, und die Animation läuft schlicht von 1 auf 0.
  //
  // Auf die gefüllte Darstellung hat es keine Wirkung.
  pfade = pfade.replaceAll("<path ", "<path pathLength={1} ");

  const uebrig = /class="cls-\d"/.exec(pfade);
  if (uebrig) throw new Error(`Nicht ersetzte Klasse in ${quelle}: ${uebrig[0]}`);

  const [, , w, h] = viewBox.split(/\s+/).map(Number);

  return `// Erzeugt aus ${quelle} - nicht von Hand bearbeiten.
// Der Schriftzug nimmt die Textfarbe an (currentColor), die Bildmarke bleibt
// in der Markenfarbe. Dadurch funktioniert das Logo in hell und dunkel.

export function ${name}({ className }: { className?: string }) {
  return (
    <svg
      viewBox="${viewBox}"
      width={${w}}
      height={${h}}
      className={className}
      role="img"
      aria-label="${beschreibung}"
      xmlns="http://www.w3.org/2000/svg"
    >
      ${pfade.trim()}
    </svg>
  );
}
`;
}

/** Nur die Pfaddaten, ohne Umhüllung - für den Ladeschirm. */
function nurPfade(quelle) {
  const roh = readFileSync(quelle, "utf8");
  const viewBox = /viewBox="([^"]+)"/.exec(roh)[1];
  const inhalt = /<g id="Ebene_1-2">([\s\S]*?)<\/g>\s*<\/svg>/.exec(roh)[1];
  const d = [...inhalt.matchAll(/\sd="([^"]+)"/g)].map((t) => t[1]);
  return { viewBox, d };
}

writeFileSync(
  "components/marke/wortmarke.tsx",
  umwandeln("images/webfaktur_wortmarke.svg", {
    name: "Wortmarke", brandKlasse: "cls-2", textKlasse: "cls-1",
    beschreibung: "Webfaktur",
  }),
);

writeFileSync(
  "components/marke/logomark.tsx",
  umwandeln("images/logomark.svg", {
    name: "Logomark", brandKlasse: "cls-1", textKlasse: null,
    beschreibung: "Webfaktur",
  }),
);

const marke = nurPfade("images/logomark.svg");
const zug = nurPfade("images/logomark-path.svg");

// Die beiden Dateien zeigen dasselbe Logo, aber unterschiedlich:
//   logomark.svg       die FLAECHE - der Umriss der fertigen Marke
//   logomark-path.svg  die LINIE   - der Weg, den der Stift genommen hat,
//                                    mit 12 Einheiten Konturstaerke
//
// Die Linie ist genau die Mittellinie der Flaeche. Nachgemessen: 229 von 230
// Abtastpunkten liegen innerhalb der Flaeche, mit im Mittel 5,6 Einheiten
// Abstand zum Rand - also der halben Konturstaerke, wie es sein muss.
//
// Illustrator hat die Linienfassung mit etwas mehr Rand exportiert. Der
// Unterschied der beiden Zeichenflaechen, halbiert, ergibt den Versatz, der
// die Linie ueber die Flaeche legt.
const [, , fb, fh] = marke.viewBox.split(/\s+/).map(Number);
const [, , zb, zh] = zug.viewBox.split(/\s+/).map(Number);
const versatz = `translate(${((fb - zb) / 2).toFixed(3)} ${((fh - zh) / 2).toFixed(3)})`;

writeFileSync(
  "components/marke/pfade.ts",
  `// Erzeugt aus images/logomark.svg und images/logomark-path.svg -
// nicht von Hand bearbeiten.
//
// Gebraucht vom Ladeschirm, der ein eigenes SVG mit einer Maske darüber
// aufbaut und deshalb nicht die fertige Komponente verwenden kann.

/** Die Fläche der Bildmarke - das, was am Ende zu sehen ist. */
export const LOGOMARK_VIEWBOX = "${marke.viewBox}";

export const LOGOMARK_PFAD =
  "${marke.d.join(" ")}";

/**
 * Die Linie, die der Stift genommen hat - die Mittellinie der Fläche.
 * Aus Illustrator, nicht zurückgerechnet.
 *
 * ZUG verläuft vom Pfeil zum linken Strich, also RÜCKWÄRTS. Gezeichnet wird
 * trotzdem von links: Der Ladeschirm dreht die Richtung um, statt die
 * Pfaddaten umzuschreiben.
 *
 * PFEIL ist der Pfeilkopf: ein V mit abgerundeter Spitze in der Mitte.
 */
export const LOGOMARK_ZUG =
  "${zug.d[0]}";

export const LOGOMARK_PFEIL =
  "${zug.d[1]}";

/** Legt die Linie deckungsgleich über die Fläche. */
export const LOGOMARK_ZUG_VERSATZ = "${versatz}";
`,
);

console.log("beide Komponenten und pfade.ts erzeugt");
