/**
 * Zeigt einen Paketnamen an, wie man ihn liest.
 *
 * In der Datenbank steht "basis" klein geschrieben - das ist richtig so,
 * denn dort ist es ein Schlüsselwort, kein Text. Auf dem Bildschirm soll es
 * aber "Basis" heißen. Diese eine Stelle sorgt dafür, damit es nicht an
 * jeder Anzeige einzeln nachgebessert werden muss.
 */
export function paketTitel(wert: string): string {
  if (!wert) return "—";
  return wert.charAt(0).toUpperCase() + wert.slice(1);
}
