import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase-Verbindung für Code, der im Browser läuft
 * (Komponenten mit "use client" oben in der Datei).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
