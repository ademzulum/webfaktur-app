import { LOGOMARK_PFAD, LOGOMARK_VIEWBOX } from "@/components/marke/pfade";

/**
 * Die Linie, entlang der die Bildmarke gezeichnet wird.
 *
 * Das ist NICHT der Umriss des Logos, sondern seine Mittellinie - der Weg,
 * den ein Stift nähme: vom linken Strich hinauf in die Schlaufe, um sie
 * herum, hinunter ins erste Tal, hinauf über den Bogen, ins zweite Tal und
 * von dort schräg hinauf in die Pfeilspitze.
 *
 * Errechnet, nicht abgezeichnet: Aus der gefüllten Fläche des Logos wurde
 * der Abstand jedes Punktes zum Rand bestimmt und daraus der Weg gesucht,
 * der möglichst weit von allen Rändern entfernt bleibt - also mittig durch
 * die Form läuft. Die Schlaufe musste eigens als Zwischenziel vorgegeben
 * werden, weil der kürzeste Weg sie sonst abkürzt.
 *
 * WENN SICH DAS LOGO ÄNDERT, stimmt diese Linie nicht mehr. Schlimm ist das
 * nicht: Am Ende wird ohnehin die vollständige Bildmarke eingeblendet, es
 * sähe dann nur die Reihenfolge des Zeichnens falsch aus.
 */
const ZUG =
  "M 0.9 40.9 Q 10.5 44 12.3 39.8 Q 14.2 35.5 13.8 30.7 Q 13.3 25.9 14.8 21 " +
  "Q 16.2 16.2 20.1 15.6 Q 24.1 15.1 26.6 19.9 Q 29 24.7 26.4 29.5 " +
  "Q 23.9 34.4 20 38.8 Q 16.2 43.2 17.8 48 Q 19.3 52.9 21.5 57.8 " +
  "Q 23.6 62.8 27.1 67.7 Q 30.7 72.5 35.5 73.2 Q 40.3 73.9 43.3 68.9 " +
  "Q 46.3 63.9 47.3 59.1 Q 48.3 54.3 48.8 49.5 Q 49.4 44.6 49.8 39.8 " +
  "Q 50.3 35 51.1 30 Q 52 25 55.2 20.4 Q 58.5 15.9 63.3 16.8 " +
  "Q 68.1 17.6 69.4 22.5 Q 70.7 27.3 68.8 32.2 Q 67 37.2 65.2 42 " +
  "Q 63.3 46.9 62 51.8 Q 60.8 56.6 60.5 61.5 Q 60.2 66.5 63.6 70.6 " +
  "Q 67 74.7 71.7 72.2 Q 76.4 69.6 79.2 64.8 Q 82.1 60 84.7 55 " +
  "Q 87.2 50 89.6 45.2 Q 92 40.4 94.5 35.5 Q 97.1 30.7 99.5 25.9 " +
  "Q 101.9 21 105.1 16.1 Q 108.2 11.1 110.5 6.2 L 112.7 1.4";

/**
 * Der Ladeschirm: Die Bildmarke wird gezeichnet wie von Hand.
 *
 * WIE DAS FUNKTIONIERT - und warum nicht anders:
 * Der Umriss des Logos zu zeichnen sähe falsch aus. Das Logo ist ein
 * Pinselstrich; sein Umriss ist die Silhouette, und die würde man
 * nachfahren wie einen Zaun statt sie zu schreiben.
 *
 * Stattdessen liegt das fertige Logo bereit und wird durch eine Maske
 * sichtbar gemacht: ein dicker Strich, der der Mittellinie folgt. Wandert
 * er entlang, kommt das Logo darunter hervor - genau dort, wo der Stift
 * gerade ist. Was erscheint, ist damit immer die echte Form, nie eine
 * Annäherung.
 *
 * Zum Schluss wird die vollständige Bildmarke eingeblendet. Das ist kein
 * Zierrat, sondern die Absicherung: Was der Strich nicht erwischt hat -
 * etwa eine besonders breite Stelle - ist danach trotzdem da.
 *
 * Reine CSS-Animation, kein Programm im Browser. Würde ein Programm den
 * Schirm steuern, erschiene er erst, NACHDEM dieses geladen ist - also
 * genau dann nicht, wenn man ihn braucht.
 *
 * Bewusst NICHT auf der Bewertungsseite: Die verspricht zwei Taps. Ein
 * Vorspann davor arbeitet gegen das Einzige, was sie können muss.
 */
export function Ladeschirm() {
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
            {/* Weiß heißt sichtbar. Der Strich ist breiter als das Logo an
                den meisten Stellen - sonst bliebe beim Zeichnen ein Rand
                stehen. */}
            <path
              d={ZUG}
              pathLength={1}
              className="ladeschirm-zug"
              fill="none"
              stroke="#fff"
              strokeWidth={21}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
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
