/**
 * Schiebt eine gleitende Markierung unter ein Element.
 *
 * Wird an drei Stellen gebraucht - Kopfmenü, Kategorien der Anrufliste und
 * Paketauswahl. Vorher hatte jede Stelle ihre eigene Rechnung, und zwei
 * davon waren falsch.
 *
 * WOVON DIE MARKIERUNG AUSGEHT - der Punkt, an dem es zweimal schiefging:
 * Eine Markierung mit "absolute" beginnt bei "links: 0" hinter dem RAHMEN
 * des Behälters, aber VOR dessen Innenabstand. Nicht am äußeren Rand, und
 * auch nicht am Anfang des Inhalts.
 *
 * Gemessen wird dagegen vom äußeren Rand. Abzuziehen ist deshalb genau die
 * Rahmenstärke - nicht mehr und nicht weniger:
 *
 *   nichts abgezogen  -> um Rahmen + Innenabstand zu weit rechts
 *   beides abgezogen  -> um den Innenabstand zu weit links
 *   nur der Rahmen    -> richtig
 *
 * Im Kopfmenü hat der Behälter weder Rahmen noch Innenabstand. Dort waren
 * alle drei Rechnungen gleich, und deshalb sah es dort immer richtig aus -
 * während dieselbe Rechnung bei Kategorien und Paketauswahl danebenlag.
 */
export function bewegeMarkierung(
  markierung: HTMLElement | null,
  behaelter: HTMLElement | null,
  ziel: HTMLElement | null,
  /** Beim allerersten Setzen: springen statt gleiten. */
  sofort = false,
): void {
  if (!markierung || !behaelter || !ziel) return;

  const aussen = behaelter.getBoundingClientRect();
  const feld = ziel.getBoundingClientRect();

  // Ist das Ziel gerade gar nicht sichtbar - etwa das Kopfmenü am Telefon,
  // das erst ab Tablet erscheint - hat es keine Ausdehnung. Dann wäre jede
  // Rechnung sinnlos, und die Markierung würde als Strich der Breite null
  // sichtbar geschaltet. Also nichts tun und auf den nächsten Anlass warten.
  if (feld.width === 0 || feld.height === 0) return;
  const stil = getComputedStyle(behaelter);

  const versatzLinks = parseFloat(stil.borderLeftWidth);
  const versatzOben = parseFloat(stil.borderTopWidth);

  // Der Rollstand zählt mit: Lässt sich die Reihe seitlich schieben, stimmt
  // die reine Bildschirmposition nicht mehr mit der Position innerhalb der
  // Reihe überein.
  const x = feld.left - aussen.left - versatzLinks + behaelter.scrollLeft;
  const y = feld.top - aussen.top - versatzOben + behaelter.scrollTop;

  // Beim ersten Setzen ohne Übergang: Sonst würde die Markierung sichtbar
  // aus der linken oberen Ecke herangeglitten kommen, weil sie dort startet.
  if (sofort) markierung.style.transition = "none";

  // Höhe wird mitgesetzt, damit die Markierung nicht von Hand zentriert
  // werden muss. Sie ist einfach so hoch wie das, worunter sie liegt.
  markierung.style.width = `${feld.width}px`;
  markierung.style.height = `${feld.height}px`;
  markierung.style.transform = `translate(${x}px, ${y}px)`;
  markierung.style.opacity = "1";

  if (sofort) {
    // Zwingt den Browser, die neue Stelle sofort zu übernehmen, bevor der
    // Übergang wieder eingeschaltet wird. Ohne diese Zeile würde er beides
    // zusammenfassen und doch gleiten.
    void markierung.offsetWidth;
    markierung.style.transition = MARKIERUNG_UEBERGANG;
  }
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
