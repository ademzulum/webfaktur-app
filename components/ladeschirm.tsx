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
 * Am Pfeil läuft der Zug hinein UND wieder heraus: erst hinauf in die
 * Spitze, dann die untere Zacke hinunter - so, wie man einen Pfeil auch von
 * Hand zeichnet.
 *
 * Das ist kein Zierrat. Die untere Zacke des Pfeilkopfs ist unterhalb von
 * y=24 ein eigener Bereich, gut zwölf Einheiten vom Schaft entfernt; der
 * Maskenstrich reicht nur zehneinhalb. Ohne den Rückweg bliebe sie beim
 * Zeichnen unberührt - man sähe nur den dünnen Schaft, und der Pfeil wirkte
 * spitz, obwohl er rund ist.
 *
 * Der letzte Punkt liegt bewusst AUSSERHALB des Logos. Der Maskenstrich
 * endet rund; landet dieser Abschluss außerhalb, rundet er nichts ab, was
 * noch zu sehen sein soll.
 *
 * WENN SICH DAS LOGO ÄNDERT, stimmt diese Linie nicht mehr. Schlimm ist das
 * nicht: Am Ende wird ohnehin die vollständige Bildmarke eingeblendet, es
 * sähe dann nur die Reihenfolge des Zeichnens falsch aus.
 */
const ZUG =
  "M 0.9 40.9 Q 10.5 44 11.4 41.9 Q 12.3 39.8 13.2 37.6 " +
  "Q 14.2 35.5 14 33.1 Q 13.8 30.7 13.6 28.3 " +
  "Q 13.3 25.9 14.1 23.4 Q 14.8 21 15.5 18.6 " +
  "Q 16.2 16.2 18.1 15.9 Q 20.1 15.6 22.1 15.3 " +
  "Q 24.1 15.1 25.4 17.5 Q 26.6 19.9 27.8 22.3 " +
  "Q 29 24.7 27.7 27.1 Q 26.4 29.5 25.1 31.9 " +
  "Q 23.9 34.4 21.9 36.6 Q 20 38.8 18.1 41 " +
  "Q 16.2 43.2 17 45.6 Q 17.8 48 18.6 50.5 " +
  "Q 19.3 52.9 20.4 55.3 Q 21.5 57.8 22.6 60.3 " +
  "Q 23.6 62.8 25.4 65.2 Q 27.1 67.7 28.9 70.1 " +
  "Q 30.7 72.5 33.1 72.8 Q 35.5 73.2 37.9 73.6 " +
  "Q 40.3 73.9 41.8 71.4 Q 43.3 68.9 44.8 66.4 " +
  "Q 46.3 63.9 46.8 61.5 Q 47.3 59.1 47.8 56.7 " +
  "Q 48.3 54.3 48.5 51.9 Q 48.8 49.5 49.1 47 " +
  "Q 49.4 44.6 49.6 42.2 Q 49.8 39.8 50 37.4 " +
  "Q 50.3 35 50.7 32.5 Q 51.1 30 51.5 27.5 " +
  "Q 52 25 53.6 22.7 Q 55.2 20.4 56.9 18.1 " +
  "Q 58.5 15.9 60.9 16.4 Q 63.3 16.8 65.7 17.2 " +
  "Q 68.1 17.6 68.8 20.1 Q 69.4 22.5 70.1 24.9 " +
  "Q 70.7 27.3 69.8 29.8 Q 68.8 32.2 67.9 34.7 " +
  "Q 67 37.2 66.1 39.6 Q 65.2 42 64.2 44.5 " +
  "Q 63.3 46.9 62.6 49.3 Q 62 51.8 61.4 54.2 " +
  "Q 60.8 56.6 60.6 59 Q 60.5 61.5 60.4 64 " +
  "Q 60.2 66.5 61.9 68.5 Q 63.6 70.6 65.3 72.7 " +
  "Q 67 74.7 69.3 73.5 Q 71.7 72.2 74.1 70.9 " +
  "Q 76.4 69.6 77.8 67.2 Q 79.2 64.8 80.7 62.4 " +
  "Q 82.1 60 83.4 57.5 Q 84.7 55 86 52.5 " +
  "Q 87.2 50 88.4 47.6 Q 89.6 45.2 90.8 42.8 " +
  "Q 92 40.4 93.2 38 Q 94.5 35.5 95.8 33.1 " +
  "Q 97.1 30.7 98.3 28.3 Q 99.5 25.9 100.7 23.4 " +
  "Q 101.9 21 103.5 18.6 Q 105.1 16.1 106.7 13.6 " +
  "Q 108.2 11.1 109.3 8.7 Q 110.5 6.2 111.7 3.6 " +
  "Q 112.9 1 112.8 5 Q 112.6 9 112.7 13.5 " +
  "Q 112.8 18 113.1 22 Q 113.4 26 113.8 29 " +
  "Q 114.3 32 115 35 L 115.8 38";

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
