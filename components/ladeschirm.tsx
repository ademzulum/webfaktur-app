import {
  LOGOMARK_PFAD,
  LOGOMARK_VIEWBOX,
  LOGOMARK_ZUG,
  LOGOMARK_ZUG_VERSATZ,
} from "@/components/marke/pfade";

/**
 * Die beiden Flügel des Pfeilkopfs.
 *
 * Sie stecken in LOGOMARK_PFEIL als ein durchgehender Zug: vom linken Ende
 * hinauf zur Spitze und wieder hinunter. Hier sind sie in zwei Hälften
 * geteilt, beide von der SPITZE aus nach außen.
 *
 * Der Grund: So lassen sie sich gleichzeitig zeichnen. Als ein Zug würde
 * erst der eine Flügel wachsen und dann der andere - es sähe aus, als wäre
 * einer vergessen und würde nachgereicht.
 *
 * Die Zahlen stammen aus LOGOMARK_PFEIL; die Spitze liegt in der Mitte
 * seiner abgerundeten Ecke.
 */
const FLUEGEL_LINKS = "M 113.7 6.6 L 91.07 17.01";
const FLUEGEL_RECHTS = "M 113.7 6.6 L 116.07 30.7";

/**
 * Der Ladeschirm: Die Bildmarke wird gezeichnet wie von Hand.
 *
 * WIE DAS FUNKTIONIERT:
 * Das fertige Logo liegt bereit und wird durch eine Maske sichtbar gemacht -
 * ein Strich, der der Mittellinie folgt. Wandert er entlang, kommt das Logo
 * darunter hervor, genau dort, wo der Stift gerade ist. Was erscheint, ist
 * damit immer die echte Form, nie eine Annäherung.
 *
 * Die Mittellinie ist nicht geschätzt: Sie kommt als eigene Datei aus
 * Illustrator (images/logomark-path.svg) und ist der Weg, den der Stift beim
 * Entwerfen genommen hat. Die Maske ist 15 Einheiten breit gegenüber den 12
 * der Kontur - nachgemessen ist damit jeder Punkt des Logos erreicht.
 *
 * Reihenfolge: erst der lange Zug vom linken Strich durch die Schlaufe und
 * beide Täler bis zum Pfeilschaft, dann beide Flügel gleichzeitig aus der
 * Spitze nach außen.
 *
 * Die Richtung stimmt bereits in den Pfaddaten - LOGOMARK_ZUG wird beim
 * Erzeugen umgedreht. Ein erster Versuch ließ stattdessen die Strichlinie
 * rückwärts laufen; im Browser sah das aus, als würde das Logo wegradiert
 * statt gezeichnet.
 *
 * Reine CSS-Animation, kein Programm im Browser. Würde ein Programm den
 * Schirm steuern, erschiene er erst, NACHDEM dieses geladen ist - also
 * genau dann nicht, wenn man ihn braucht.
 *
 * Bewusst NICHT auf der Bewertungsseite: Die verspricht zwei Taps. Ein
 * Vorspann davor arbeitet gegen das Einzige, was sie können muss.
 */
export function Ladeschirm() {
  const strich = {
    fill: "none",
    stroke: "#fff",
    strokeWidth: 15,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <div className="ladeschirm" aria-hidden>
      <svg viewBox={LOGOMARK_VIEWBOX} className="ladeschirm-marke">
        <defs>
          <mask
            id="webfaktur-zug"
            maskUnits="userSpaceOnUse"
            x="-20"
            y="-20"
            width="160"
            height="121"
          >
            {/* Weiß heißt sichtbar. Der Versatz legt die Linie aus
                Illustrator deckungsgleich über die Fläche. */}
            <g transform={LOGOMARK_ZUG_VERSATZ}>
              <path
                d={LOGOMARK_ZUG}
                pathLength={1}
                className="ladeschirm-zug"
                {...strich}
              />
              {/* Beide Flügel tragen dieselbe Klasse und damit dieselbe
                  Verzögerung - sie laufen gleichzeitig los. */}
              {[FLUEGEL_LINKS, FLUEGEL_RECHTS].map((d) => (
                <path
                  key={d}
                  d={d}
                  pathLength={1}
                  className="ladeschirm-fluegel"
                  {...strich}
                />
              ))}
            </g>
          </mask>
        </defs>

        <path
          d={LOGOMARK_PFAD}
          className="ladeschirm-tinte"
          mask="url(#webfaktur-zug)"
        />
        <path d={LOGOMARK_PFAD} className="ladeschirm-fertig" />
      </svg>
    </div>
  );
}
