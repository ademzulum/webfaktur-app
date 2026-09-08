/** Wo die gewählte Ansicht im Browser hinterlegt wird. */
export const THEME_SPEICHER = "webfaktur-theme";

/**
 * Farbe der Systemleiste des Browsers, je Ansicht.
 *
 * Entspricht --background aus globals.css. Die Leiste soll nahtlos in die
 * Seite übergehen - stimmen die beiden nicht überein, sieht man am oberen
 * Rand einen Streifen in der falschen Farbe.
 */
export const LEISTENFARBE = {
  dunkel: "#0a0a0b",
  hell: "#ffffff",
} as const;

/**
 * Setzt die Farbe der Systemleiste.
 *
 * Diese Farbe steht in einer Angabe im Kopfbereich der Seite. Sie war
 * vorher fest auf Dunkel eingestellt und änderte sich beim Umschalten
 * nicht mit - deshalb blieb die Leiste am iPhone in der Farbe hängen, die
 * beim Öffnen der Seite gerade galt.
 *
 * Es werden ALLE gefundenen Angaben gesetzt, nicht nur die erste: Gäbe es
 * je zwei davon, würde der Browser die erste nehmen, und eine übersehene
 * zweite wäre ein Fehler, den man nur am Telefon sieht.
 */
export function setzeLeistenfarbe(dunkel: boolean): void {
  const farbe = dunkel ? LEISTENFARBE.dunkel : LEISTENFARBE.hell;
  const angaben = document.querySelectorAll('meta[name="theme-color"]');

  if (angaben.length === 0) {
    const angabe = document.createElement("meta");
    angabe.setAttribute("name", "theme-color");
    angabe.setAttribute("content", farbe);
    document.head.appendChild(angabe);
    return;
  }

  angaben.forEach((angabe) => angabe.setAttribute("content", farbe));
}
