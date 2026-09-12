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
 * Beide fahren die abgerundete Spitze KOMPLETT mit, bevor sie nach außen
 * laufen. Träfen sie sich nur in einem Punkt, bliebe von der Rundung ein
 * Rest übrig, den keiner von beiden abdeckt.
 *
 * Die Zahlen stammen unverändert aus LOGOMARK_PFEIL.
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
 * Die Mittellinie ist nicht geschätzt: Sie kommt als eigene Datei aus
 * Illustrator (images/logomark-path.svg) und ist der Weg, den der Stift beim
 * Entwerfen genommen hat. Die Maske ist 15 Einheiten breit gegenüber den 12
 * der Kontur - nachgemessen erreicht sie damit alle 56.610 Bildpunkte des
 * Logos, bei 14 bleiben sieben Stellen offen.
 *
 * ZUR KREUZUNG DER SCHLAUFE:
 * Der Stift kommt bei 12 Prozent des Zuges das erste Mal an die Stelle
 * (14.8, 42.1) und bei 31 Prozent das zweite Mal. Beim ersten Mal färbt sich
 * dort schon ein Stück des zweiten Zuges mit - für rund 210 Millisekunden
 * steht ein Stummel im Bild.
 *
 * Das ist zum größten Teil nicht zu vermeiden: An einer Kreuzung liegt
 * dieselbe Tinte auf beiden Zügen, ein Stift kann sie nicht zweimal
 * auftragen. Selbst mit einer Maske in exakter Stiftbreite blieben rund
 * zehn Einheiten übrig.
 *
 * Ganz wegzubekommen wäre es nur, wenn das Logo als ZWEI getrennte Flächen
 * vorläge - vor und nach der Kreuzung. Dann könnte jeder Durchgang seine
 * eigene Fläche aufdecken und käme der anderen gar nicht nahe. Dafür müsste
 * die Illustrator-Datei an der Kreuzung geteilt werden.
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
    // 14 und keinen Punkt breiter.
    //
    // Dort, wo die Schlaufe sich selbst kreuzt, deckt der Strich unweigerlich
    // ein Stück des noch nicht gezeichneten Zuges mit auf - er kommt ihm ja
    // zu nahe. Wie lang dieser Stummel ist, hängt an der Breite:
    //   Breite 15: 13,8 Einheiten
    //   Breite 14: 12,5 Einheiten, Logo noch vollständig erreicht
    //   Breite 13: 11,3 Einheiten, aber 446 Stellen bleiben offen
    // Bei der echten Stiftbreite 12 wären es rund 10. Der Löwenanteil ist
    // also nicht zu vermeiden - siehe die Erklärung weiter unten.
    strokeWidth: 14,
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

        {/* Nur dieses eine Bild. Früher wurde am Ende zusätzlich die
            vollständige Marke eingeblendet, als Auffangnetz für Stellen,
            die der Strich verfehlt. Das ist nicht mehr nötig: Nachgemessen
            erreicht der Strich alle 56.610 Bildpunkte des Logos. Und es
            war schädlich - das Einblenden legte sich über das bereits
            Gezeichnete und ließ es am Schluss aufblitzen. */}
        <path
          d={LOGOMARK_PFAD}
          className="ladeschirm-tinte"
          mask="url(#webfaktur-zug)"
        />
      </svg>
    </div>
  );
}
