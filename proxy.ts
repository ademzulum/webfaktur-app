import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Läuft vor jedem Seitenaufruf.
 *
 * Zwei Aufgaben:
 * 1. Die Anmelde-Sitzung auffrischen, damit sie nicht nach kurzer Zeit abläuft.
 * 2. Nicht angemeldete Besucher aus geschützten Bereichen zur Anmeldung schicken.
 *
 * Hieß in Next.js 15 noch "middleware.ts" - seit Version 16 "proxy.ts".
 */
export async function proxy(request: NextRequest) {
  let antwort = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          antwort = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            antwort.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Fragt den Supabase-Server, ob die Sitzung echt und gültig ist.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pfad = request.nextUrl.pathname;

  // Geschützter Bereich ohne Anmeldung -> zur Anmeldeseite
  if (!user && pfad.startsWith("/dashboard")) {
    const ziel = request.nextUrl.clone();
    ziel.pathname = "/login";
    return NextResponse.redirect(ziel);
  }

  // Bereits angemeldet -> Anmeldeseite überspringen
  if (user && pfad === "/login") {
    const ziel = request.nextUrl.clone();
    ziel.pathname = "/dashboard";
    return NextResponse.redirect(ziel);
  }

  return antwort;
}

export const config = {
  // Läuft auf allen Seiten AUSSER auf Dateien wie Bildern, Schriften und
  // Skripten. Ohne diese Ausnahme würde der Torwächter auch das Laden von
  // Bildern und CSS abfangen.
  //
  // sw.js und manifest.webmanifest sind ebenfalls ausgenommen. Beide werden
  // vom Telefon selbst geholt, ohne Anmeldung - und der Hintergrunddienst
  // wird bei JEDEM Seitenaufruf erneut geprüft. Ihn durch die Sitzungs-
  // prüfung zu schicken, wäre reine Verschwendung.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
