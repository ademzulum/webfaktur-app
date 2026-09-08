import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { holeAngemeldetenNutzer } from "@/lib/nutzer";

import { betriebAnlegen } from "../actions";
import { BetriebFormular } from "../betrieb-formular";

export default async function NeuerBetrieb() {
  const nutzer = await holeAngemeldetenNutzer();
  if (!nutzer) redirect("/login");
  if (nutzer.rolle !== "admin") redirect("/dashboard");

  return (
    <main className="auftauchen mx-auto w-full max-w-2xl flex-1 px-5 py-10 sm:px-6 sm:py-16">
      <Link
        href="/dashboard/betriebe"
        className="mb-6 inline-flex items-center gap-1 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Alle Betriebe
      </Link>
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">
        Neuer Betrieb
      </h1>
      <BetriebFormular aktion={betriebAnlegen} knopfbeschriftung="Anlegen" />
    </main>
  );
}
