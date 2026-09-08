"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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

  const istAktiv = (ziel: string) =>
    ziel === "/dashboard" ? pfad === ziel : pfad.startsWith(ziel);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-5 px-4 sm:h-18 sm:gap-7 sm:px-6">
        <Link
          href="/dashboard"
          className="shrink-0 rounded-md transition-opacity hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          aria-label="Zur Übersicht"
        >
          <Wortmarke className="h-5 w-auto sm:h-6" />
        </Link>

        {/* Ab Tablet: Punkte direkt in der Leiste */}
        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {punkte.map((punkt) => (
            <Link
              key={punkt.pfad}
              href={punkt.pfad}
              aria-current={istAktiv(punkt.pfad) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-sm transition-colors duration-200",
                istAktiv(punkt.pfad)
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
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
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-4 sm:px-6">
            {punkte.map((punkt) => (
              <Link
                key={punkt.pfad}
                href={punkt.pfad}
                onClick={() => setOffen(false)}
                aria-current={istAktiv(punkt.pfad) ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm transition-colors",
                  istAktiv(punkt.pfad)
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {punkt.titel}
              </Link>
            ))}
            <form action={abmelden} className="mt-2 border-t border-border pt-3">
              <Button type="submit" variant="outline" size="sm" className="w-full">
                Abmelden
              </Button>
            </form>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
