/**
 * Beträge liegen in der Datenbank als ganze Cent. Das vermeidet die
 * Rundungsfehler, die bei Kommazahlen entstehen und sich über viele
 * Datensätze aufsummieren würden.
 *
 * Diese Datei übersetzt zwischen Cent und der Anzeige für Menschen.
 */

/** 25000 -> "250,00 €" */
export function centAlsEuro(cent: number): string {
  return new Intl.NumberFormat("de-AT", {
    style: "currency",
    currency: "EUR",
  }).format(cent / 100);
}

/** 25000 -> "250,00"  (für Eingabefelder, ohne Währungszeichen) */
export function centFuerEingabe(cent: number): string {
  return (cent / 100).toFixed(2).replace(".", ",");
}

/**
 * "250,00" | "1.000" | "250.50" -> Cent, oder null bei ungültiger Eingabe.
 *
 * Erkennt die österreichische Schreibweise mit Komma als Dezimaltrennzeichen
 * und Punkt als Tausendertrennzeichen, versteht aber auch "250.50".
 */
export function euroInCent(eingabe: string): number | null {
  let text = eingabe.trim().replace(/[\s€]/g, "");
  if (!text) return null;

  if (text.includes(",")) {
    // Komma vorhanden -> Punkte sind Tausendertrennzeichen
    text = text.replace(/\./g, "").replace(",", ".");
  } else if (/\.\d{3}(\.|$)/.test(text)) {
    // "1.000" oder "1.000.000" -> Tausendertrennzeichen
    text = text.replace(/\./g, "");
  }

  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  return Math.round(Number(text) * 100);
}
