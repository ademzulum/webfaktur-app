"use client";

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
   * Öffnet oder schließt das Menü am Handy.
   *
   * Solange es offen ist, wird das Scrollen der Seite dahinter gesperrt.
   * Ohne das würde man beim Wischen die darunterliegende Seite bewegen,
   * was verwirrend ist, weil man sie gar nicht sieht.
   */
  function setzeMenue(neu: boolean) {
    setOffen(neu);
    document.body.style.overflow = neu ? "hidden" : "";
  }

  /**
   * Schiebt die Markierung unter das übergebene Element.
   *
   * Bewusst über die DOM-Eigenschaften statt über React-Zustand: Sonst
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
    <>
      {/* Kopfleiste und Vollbildmenü sind BEWUSST Geschwister und nicht
          ineinander verschachtelt.
          Der Grund: Die Leiste hat einen Weichzeichner (backdrop-blur).
          Ein Element mit Weichzeichner wird zum Bezugsrahmen für alles,
          was darin "am Bildschirm festgemacht" ist. Läge das Menü innen,
          würde es sich an der Leiste ausrichten statt am Bildschirm - und
          wäre damit null Pixel hoch. */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-6xl items-center gap-6 px-4 sm:h-24 sm:gap-10 sm:px-6">
          <Link
            href="/dashboard"
            onClick={() => setzeMenue(false)}
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
              className="pointer-events-none absolute top-1/2 left-0 h-11 -translate-y-1/2 rounded-full bg-muted opacity-0"
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
                  "weich relative z-10 rounded-full px-4 py-2.5 text-[0.9375rem]",
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
              aria-controls="hauptmenue"
              onClick={() => setzeMenue(!offen)}
            >
              <Menuezeichen offen={offen} />
            </Button>
          </div>
        </div>
      </header>

      {/* Handy: Menü über die ganze Seite.
          Bewusst immer im Dokument und nur aus- bzw. eingeblendet - nur so
          gibt es auch beim Schließen eine Bewegung. Würde es beim Schließen
          entfernt, wäre es schlagartig weg.
          "inert" nimmt es im geschlossenen Zustand vollständig aus der
          Bedienung: nicht anklickbar, nicht per Tabulator erreichbar und
          für Vorleseprogramme nicht vorhanden. */}
      <div
        id="hauptmenue"
        inert={!offen}
        className={cn(
          "fixed inset-x-0 top-20 bottom-0 z-30 flex flex-col bg-background transition-[opacity,transform] duration-[420ms] ease-[var(--ease-weich)] sm:top-24 md:hidden",
          offen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-3 opacity-0",
        )}
      >
        <nav className="flex flex-col px-4 pt-4 sm:px-6">
          {punkte.map((punkt, i) => (
            <Link
              key={punkt.pfad}
              href={punkt.pfad}
              onClick={() => setzeMenue(false)}
              aria-current={istAktiv(punkt.pfad) ? "page" : undefined}
              // Die Punkte kommen nacheinander herein, nicht alle auf einmal.
              // Beim Schließen ohne Versatz, damit es zügig verschwindet.
              style={{ transitionDelay: offen ? `${80 + i * 60}ms` : "0ms" }}
              className={cn(
                "flex items-center gap-3 border-b border-border/60 py-5 text-2xl transition-[opacity,transform] duration-[420ms] ease-[var(--ease-weich)]",
                offen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
                istAktiv(punkt.pfad)
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  istAktiv(punkt.pfad) ? "bg-primary" : "bg-transparent",
                )}
              />
              {punkt.titel}
            </Link>
          ))}
        </nav>

        <form
          action={abmelden}
          className="mt-auto px-4 pb-10 sm:px-6"
          style={{
            transitionDelay: offen ? `${80 + punkte.length * 60}ms` : "0ms",
          }}
        >
          <Button type="submit" variant="outline" size="lg" className="w-full">
            Abmelden
          </Button>
        </form>
      </div>
    </>
  );
}

/**
 * Die zwei Striche, die sich zum Kreuz drehen.
 *
 * Kein fertiges Symbol, weil zwei ausgetauschte Bilder springen würden.
 * Hier sind es dieselben zwei Striche die ganze Zeit: Sie rücken zur Mitte
 * zusammen und drehen sich dabei gegeneinander. Deshalb wirkt es
 * durchgehend statt umgeschaltet.
 */
function Menuezeichen({ offen }: { offen: boolean }) {
  const gemeinsam =
    "absolute top-1/2 left-0 h-[1.5px] w-5 rounded-full bg-current transition-transform duration-[380ms] ease-[var(--ease-weich)]";

  return (
    <span aria-hidden className="relative block h-4 w-5">
      <span
        className={gemeinsam}
        style={{
          transform: offen
            ? "translateY(-50%) rotate(45deg)"
            : "translateY(calc(-50% - 4px))",
        }}
      />
      <span
        className={gemeinsam}
        style={{
          transform: offen
            ? "translateY(-50%) rotate(-45deg)"
            : "translateY(calc(-50% + 4px))",
        }}
      />
    </span>
  );
}
