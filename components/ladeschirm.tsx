import {
  LOGOMARK_PFAD,
  LOGOMARK_VIEWBOX,
  LOGOMARK_ZUG_VERSATZ,
  ZUG_ANFANG,
  ZUG_SCHLAUFE,
  ZUG_W,
} from "@/components/marke/pfade";

/**
 * Die beiden Flügel des Pfeilkopfs.
 *
 * ZUG_PFEIL ist ein durchgehender Zug: vom linken Ende hinauf zur Spitze und
 * wieder hinunter. Hier ist er in zwei Hälften geteilt, beide von der SPITZE
 * aus nach außen - nur so lassen sie sich gleichzeitig zeichnen. Als ein Zug
 * würde erst der eine Flügel wachsen und dann der andere; es sähe aus, als
 * wäre einer vergessen und würde nachgereicht.
 *
 * Beide fahren die abgerundete Spitze KOMPLETT mit. Träfen sie sich nur in
 * einem Punkt, bliebe von der Rundung ein Rest übrig, den keiner von beiden
 * abdeckt - genau der Punkt, der vorher am Pfeil stehen blieb.
 *
 * Die Zahlen stammen unverändert aus ZUG_PFEIL.
 */
const FLUEGEL_LINKS =
  "M114.7,7.28C114.7,6.82 114.47,6.44 114.14,6.22" +
  "C113.73,5.94 113.15,5.9 112.68,6.24L91.07,17.01";

const FLUEGEL_RECHTS =
  "M112.68,6.24C113.15,5.9 113.73,5.94 114.14,6.22" +
  "C114.47,6.44 114.7,6.82 114.7,7.28L116.07,30.7";

/**
 * Der Ladeschirm: Die Bildmarke wird gezeichnet wie von Hand.
 *
 * WIE DAS FUNKTIONIERT:
 * Das fertige Logo liegt bereit und wird durch eine Maske sichtbar gemacht -
 * ein Strich, der der Mittellinie folgt. Wandert er entlang, kommt das Logo
 * darunter hervor, genau dort, wo der Stift gerade ist. Was erscheint, ist
 * damit immer die echte Form, nie eine Annäherung.
 *
 * Die Mittellinie ist nicht geschätzt: Sie kommt aus Illustrator
 * (images/logo-cut.svg), in vier benannte Teile zerschnitten - so, wie der
 * Stift sie nacheinander zieht:
 *
 *   1. AnfangSchlaufe   der waagrechte Strich links, hinauf zur Schlaufe
 *   2. Schlaufe         die Runde
 *   3. W                beide Täler und hinauf zum Pfeilschaft
 *   4. Pfeilkopf        beide Flügel, gleichzeitig aus der Spitze
 *
 * Reine CSS-Animation, kein Programm im Browser. Würde ein Programm den
 * Schirm steuern, erschiene er erst, NACHDEM dieses geladen ist - also
 * genau dann nicht, wenn man ihn braucht.
 *
 * Bewusst NICHT auf der Bewertungsseite: Die verspricht zwei Taps. Ein
 * Vorspann davor arbeitet gegen das Einzige, was sie können muss.
 */
export function Ladeschirm() {
  /**
   * Wie breit die Maske je Teil ist.
   *
   * 15 überall wäre am einfachsten, aber der erste Teil kreuzt bei
   * (16.2, 43.1) den späteren W-Zug. Was der Strich dort mit aufdeckt, steht
   * als Stummel im Bild, bis der W-Zug nachkommt. Je schmaler, desto kürzer
   * der Stummel - nur darf das Logo nirgends unerreicht bleiben. Gemessen an
   * allen 56.610 Bildpunkten:
   *
   *   alle 15:                    0 unerreicht,  Stummel 14,7
   *   AnfangSchlaufe 13, Rest 15: 0 unerreicht,  Stummel 12,3
   *   AnfangSchlaufe 12, Rest 15: 12 unerreicht, Stummel 11,1
   *
   * Ganz wegzubekommen ist er nicht: An einer Kreuzung liegt dieselbe Tinte
   * auf beiden Zügen, ein Stift kann sie nicht zweimal auftragen.
   */
  const strich = (breite: number) => ({
    fill: "none",
    stroke: "#fff",
    strokeWidth: breite,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    pathLength: 1,
  });

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
              <path d={ZUG_ANFANG} className="zug-anfang" {...strich(13)} />
              <path d={ZUG_SCHLAUFE} className="zug-schlaufe" {...strich(15)} />
              <path d={ZUG_W} className="zug-w" {...strich(15)} />
              {/* Beide Flügel tragen dieselbe Klasse und damit dieselbe
                  Verzögerung - sie laufen gleichzeitig los. */}
              {[FLUEGEL_LINKS, FLUEGEL_RECHTS].map((d) => (
                <path key={d} d={d} className="zug-fluegel" {...strich(15)} />
              ))}
            </g>
          </mask>
        </defs>

        <path
          d={LOGOMARK_PFAD}
          className="ladeschirm-tinte"
          mask="url(#webfaktur-zug)"
        />
      </svg>
    </div>
  );
}
