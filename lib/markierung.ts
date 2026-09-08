/**
 * Schiebt eine gleitende Markierung unter ein Element.
 *
 * Wird an drei Stellen gebraucht - Kopfmenü, Kategorien der Anrufliste und
 * Paketauswahl. Vorher hatte jede Stelle ihre eigene Rechnung, und zwei
 * davon waren falsch.
 *
 * DER FEHLER, den das hier behebt:
 * Eine Markierung mit "absolute" wird nicht am äußeren Rand ihres Behälters
 * ausgerichtet, sondern am INNENbereich - also hinter Rahmen und
 * Innenabstand. Gemessen wurde aber vom äußeren Rand. Bei einem Behälter mit
 * 4 Pixel Innenabstand saß die Markierung deshalb 4 Pixel zu weit rechts,
 * bei jedem Eintrag gleich - und beim letzten lief sie aus dem Kasten
 * heraus. Sichtbar wurde es erst dort, wo rechts kein Platz mehr war.
 *
 * Deshalb werden Rahmen und Innenabstand hier abgezogen.
 */
export function bewegeMarkierung(
  markierung: HTMLElement | null,
  behaelter: HTMLElement | null,
  ziel: HTMLElement | null,
): void {
  if (!markierung || !behaelter || !ziel) return;

  const aussen = behaelter.getBoundingClientRect();
  const feld = ziel.getBoundingClientRect();
  const stil = getComputedStyle(behaelter);

  const versatzLinks =
    parseFloat(stil.borderLeftWidth) + parseFloat(stil.paddingLeft);
  const versatzOben =
    parseFloat(stil.borderTopWidth) + parseFloat(stil.paddingTop);

  // Der Rollstand zählt mit: Lässt sich die Reihe seitlich schieben, stimmt
  // die reine Bildschirmposition nicht mehr mit der Position innerhalb der
  // Reihe überein.
  const x = feld.left - aussen.left - versatzLinks + behaelter.scrollLeft;
  const y = feld.top - aussen.top - versatzOben + behaelter.scrollTop;

  // Höhe wird mitgesetzt, damit die Markierung nicht von Hand zentriert
  // werden muss. Sie ist einfach so hoch wie das, worunter sie liegt.
  markierung.style.width = `${feld.width}px`;
  markierung.style.height = `${feld.height}px`;
  markierung.style.transform = `translate(${x}px, ${y}px)`;
  markierung.style.opacity = "1";
}

/**
 * Der Übergang, den alle gleitenden Markierungen benutzen.
 *
 * Die Breite folgt langsamer als die Position - dadurch zieht sich die
 * Markierung beim Wandern kurz in die Länge und wirkt wie etwas
 * Zusammenhängendes statt wie ein springender Kasten.
 */
export const MARKIERUNG_UEBERGANG =
  "transform 380ms var(--ease-federnd), width 560ms var(--ease-federnd), height 380ms var(--ease-federnd), opacity 200ms linear";
