import { createHash, randomBytes } from "node:crypto";

/**
 * Erzeugt einen Einmal-Token für den Bewertungslink.
 *
 * 32 zufällige Bytes aus dem kryptografischen Zufallsgenerator des
 * Betriebssystems. Nicht erratbar - man müsste im Schnitt 2^255 Versuche
 * machen. Die Kodierung "base64url" erzeugt nur Zeichen, die in einer
 * Adresszeile unverändert bleiben.
 */
export function tokenErzeugen(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Der Wert, der in der Datenbank landet.
 *
 * Gespeichert wird ausschließlich dieser Hash, nie der Token selbst. Aus dem
 * Hash lässt sich der Token nicht zurückrechnen - wer die Datenbank läse,
 * könnte daraus also keinen funktionierenden Link bauen.
 *
 * Muss zur Berechnung in SQL passen:
 *   encode(sha256(convert_to(token, 'UTF8')), 'hex')
 */
export function tokenHash(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
