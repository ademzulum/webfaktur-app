/**
 * Supabase liefert eingebettete Tabellen unterschiedlich aus, je nachdem,
 * wie die Verknüpfung aussieht:
 *
 *   - gewöhnliche Verknüpfung  -> ein Array
 *   - Verknüpfung mit "unique"  -> ein einzelnes Objekt oder null
 *
 * Auf bewertungen.anruf_id liegt ein "unique" (pro Anruf höchstens eine
 * Bewertung), deshalb kommt dort KEIN Array zurück. Das hat schon einmal
 * einen Absturz verursacht.
 *
 * Diese Funktion nimmt beide Formen entgegen und liefert immer den ersten
 * Wert oder null.
 */
export function einzelwert<T>(wert: T | T[] | null | undefined): T | null {
  if (wert === null || wert === undefined) return null;
  if (Array.isArray(wert)) return wert.length > 0 ? wert[0] : null;
  return wert;
}
