/**
 * Die Adresse, unter der die App erreichbar ist - Grundlage für die Links
 * in der SMS. Lokal etwas anderes als auf Vercel, deshalb konfigurierbar.
 */
export function basisUrl(): string {
  const gesetzt = process.env.APP_BASIS_URL;
  if (gesetzt) return gesetzt.replace(/\/+$/, "");

  // Von Vercel automatisch bereitgestellt, falls nichts eingetragen wurde.
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}
