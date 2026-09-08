"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

import { Wortmarke } from "@/components/marke/wortmarke";
import { ThemeUmschalter } from "@/components/theme-umschalter";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

export type Menuepunkt = { titel: string; pfad: string };

export function Kopfleiste({
  punkte,
  abmelden,
}: {
  punkte: Menuepunkt[];
  abmelden: () => Promise<void>;
}) {
  const pfad = usePathname();
  const [offen, setOffen] = useState(false);

  const navRef = useRef<HTMLElement | null>(null);
  const markierungRef = useRef<HTMLSpanElement | null>(null);
  const aktivRef = useRef<HTMLElement | null>(null);

  const istAktiv = (ziel: string) =>
    ziel === "/dashboard" ? pfad === ziel : pfad.startsWith(ziel);

  /**
   * Schiebt die Markierung unter das übergebene Element.
   *
   * Bewusst über die DOM-Eigenschaften statt ueber React-Zustand: Sonst
   * würde jede Mausbewegung die ganze Leiste neu zeichnen lassen.
   */
  function bewegeZu(ziel: HTMLElement | null) {
    const markierung = markierungRef.current;
    const nav = navRef.current;
    if (!markierung || !nav || !ziel) return;

    const rahmen = nav.getBoundingClientRect();
    const feld = ziel.getBoundingClientRect();

    markierung.style.width = `${feld.width}px`;
    markierung.style.transform = `translateX(${feld.left - rahmen.left}px)`;
    markierung.style.opacity = "1";
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center gap-6 px-4 sm:h-24 sm:gap-10 sm:px-6">
        <Link
          href="/dashboard"
          className="weich shrink-0 rounded-md hover:opacity-70 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          aria-label="Zur Übersicht"
        >
          <Wortmarke className="h-6 w-auto sm:h-7" />
        </Link>

        {/* Ab Tablet: Punkte in der Leiste, mit wandernder Markierung */}
        <nav
          ref={navRef}
          onMouseLeave={() => bewegeZu(aktivRef.current)}
          className="relative hidden flex-1 items-center md:flex"
        >
          {/* Die Markierung. Die Breite folgt langsamer als die Position -
              dadurch zieht sie sich beim Wandern kurz in die Länge und wirkt
              wie etwas Zusammenhängendes statt wie ein springender Kasten. */}
          <span
            ref={markierungRef}
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-0 h-10 -translate-y-1/2 rounded-full bg-muted opacity-0"
            style={{
              transition:
                "transform 380ms var(--ease-federnd), width 560ms var(--ease-federnd), opacity 200ms linear",
            }}
          />

          {punkte.map((punkt) => (
            <Link
              key={punkt.pfad}
              href={punkt.pfad}
              ref={(el) => {
                if (!istAktiv(punkt.pfad)) return;
                aktivRef.current = el;
                bewegeZu(el);

                // Beim Laden sind die Schriften oft noch nicht da, die Punkte
                // werden danach breiter. Und bei Größenänderung des
                // Fensters stimmt die Position ebenfalls nicht mehr.
                const nachmessen = () => bewegeZu(aktivRef.current);
                window.addEventListener("resize", nachmessen);
                document.fonts?.ready.then(nachmessen);

                return () => window.removeEventListener("resize", nachmessen);
              }}
              onMouseEnter={(e) => bewegeZu(e.currentTarget)}
              onFocus={(e) => bewegeZu(e.currentTarget)}
              aria-current={istAktiv(punkt.pfad) ? "page" : undefined}
              className={cn(
                "weich relative z-10 rounded-full px-4 py-2 text-sm",
                istAktiv(punkt.pfad)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {punkt.titel}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <ThemeUmschalter />

          <form action={abmelden} className="hidden md:block">
            <Button type="submit" variant="ghost" size="sm">
              Abmelden
            </Button>
          </form>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={offen ? "Menü schließen" : "Menü öffnen"}
            aria-expanded={offen}
            onClick={() => setOffen((o) => !o)}
          >
            {offen ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Handy: aufklappendes Menü */}
      {offen ? (
        <div className="auftauchen border-t border-border bg-background md:hidden">
          <nav className="auftauchen-gestaffelt mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-4 sm:px-6">
            {punkte.map((punkt, i) => (
              <Link
                key={punkt.pfad}
                href={punkt.pfad}
                onClick={() => setOffen(false)}
                style={{ "--verzoegerung": i } as React.CSSProperties}
                aria-current={istAktiv(punkt.pfad) ? "page" : undefined}
                className={cn(
                  "weich rounded-lg px-4 py-3 text-sm",
                  istAktiv(punkt.pfad)
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {punkt.titel}
              </Link>
            ))}
            <form action={abmelden} className="mt-3 border-t border-border pt-4">
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="w-full"
              >
                Abmelden
              </Button>
            </form>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
