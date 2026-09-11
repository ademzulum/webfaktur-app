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


/**
 * Dreht einen Pfad um: aus "von A nach B" wird "von B nach A".
 *
 * Gebraucht für den Ladeschirm. Der Zug aus Illustrator verläuft vom Pfeil
 * zum linken Strich, gezeichnet werden soll aber von links.
 *
 * Der naheliegende Trick wäre, die Strichlinie beim Zeichnen rückwärts
 * laufen zu lassen. Das sah im Browser aus, als würde das Logo wegradiert -
 * deshalb wird hier der Pfad selbst umgedreht. Das Ergebnis ist dieselbe
 * Linie, nur andersherum durchlaufen, und beim Zeichnen gibt es nichts mehr
 * zu verdrehen.
 *
 * Eine umgedrehte Kurve behält ihre Form: Anfang und Ende tauschen, und die
 * beiden Griffe dazwischen ebenfalls.
 */
function umdrehen(d) {
  const zahl = /[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g;
  const stuecke = [...d.matchAll(/([MmLlHhVvCcSsZz])([^MmLlHhVvCcSsZz]*)/g)];

  let cur = [0, 0];
  let letzterGriff = null;
  const segmente = [];

  for (const [, befehl, rest] of stuecke) {
    const w = (rest.match(zahl) || []).map(Number);
    const rel = befehl === befehl.toLowerCase();
    let art = befehl.toUpperCase();
    let i = 0;
    if (art === "Z") continue;

    while (i < w.length) {
      if (art === "M") {
        let [x, y] = [w[i], w[i + 1]]; i += 2;
        if (rel) { x += cur[0]; y += cur[1]; }
        cur = [x, y]; letzterGriff = null; art = "L";
      } else if (art === "L" || art === "H" || art === "V") {
        let x, y;
        if (art === "L") { x = w[i]; y = w[i + 1]; i += 2; if (rel) { x += cur[0]; y += cur[1]; } }
        else if (art === "H") { x = w[i]; i += 1; if (rel) x += cur[0]; y = cur[1]; }
        else { y = w[i]; i += 1; if (rel) y += cur[1]; x = cur[0]; }
        segmente.push({ art: "L", von: cur, nach: [x, y] });
        cur = [x, y]; letzterGriff = null;
      } else if (art === "C" || art === "S") {
        let g1, g2, p;
        if (art === "C") {
          g1 = [w[i], w[i + 1]]; g2 = [w[i + 2], w[i + 3]]; p = [w[i + 4], w[i + 5]]; i += 6;
          if (rel) {
            g1 = [g1[0] + cur[0], g1[1] + cur[1]];
            g2 = [g2[0] + cur[0], g2[1] + cur[1]];
            p = [p[0] + cur[0], p[1] + cur[1]];
          }
        } else {
          g2 = [w[i], w[i + 1]]; p = [w[i + 2], w[i + 3]]; i += 4;
          if (rel) {
            g2 = [g2[0] + cur[0], g2[1] + cur[1]];
            p = [p[0] + cur[0], p[1] + cur[1]];
          }
          g1 = letzterGriff
            ? [2 * cur[0] - letzterGriff[0], 2 * cur[1] - letzterGriff[1]]
            : cur;
        }
        segmente.push({ art: "C", von: cur, g1, g2, nach: p });
        letzterGriff = g2; cur = p;
      } else {
        i = w.length;
      }
    }
  }

  const r = (n) => Number(n.toFixed(2));
  const letzte = segmente[segmente.length - 1].nach;
  let out = `M${r(letzte[0])},${r(letzte[1])}`;
  for (let k = segmente.length - 1; k >= 0; k--) {
    const s = segmente[k];
    out += s.art === "L"
      ? `L${r(s.von[0])},${r(s.von[1])}`
      : `C${r(s.g2[0])},${r(s.g2[1])} ${r(s.g1[0])},${r(s.g1[1])} ${r(s.von[0])},${r(s.von[1])}`;
  }
  return out;
}

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
 * ZUG ist gegenüber der Illustrator-Datei UMGEDREHT: Dort verläuft die Linie
 * vom Pfeil nach links, gezeichnet werden soll aber von links. Das Umdrehen
 * passiert beim Erzeugen, damit beim Zeichnen selbst nichts zu verdrehen
 * bleibt.
 *
 * PFEIL ist der Pfeilkopf: ein V mit abgerundeter Spitze in der Mitte.
 */
export const LOGOMARK_ZUG =
  "${umdrehen(zug.d[0])}";

export const LOGOMARK_PFEIL =
  "${zug.d[1]}";

/** Legt die Linie deckungsgleich über die Fläche. */
export const LOGOMARK_ZUG_VERSATZ = "${versatz}";
`,
);

console.log("beide Komponenten und pfade.ts erzeugt");
