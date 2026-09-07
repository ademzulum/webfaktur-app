import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase-Verbindung für Code, der auf dem Server läuft.
 * Liest und schreibt Cookies, damit eine spätere Anmeldung
 * über Seitenaufrufe hinweg bestehen bleibt.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Aus einer Server Component heraus darf man keine Cookies setzen.
            // Sobald die Anmeldung dazukommt, übernimmt das eine Middleware.
          }
        },
      },
    },
  );
}
