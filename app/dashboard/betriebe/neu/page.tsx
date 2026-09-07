import { redirect } from "next/navigation";

import { holeAngemeldetenNutzer } from "@/lib/nutzer";

import { betriebAnlegen } from "../actions";
import { BetriebFormular } from "../betrieb-formular";

export default async function NeuerBetrieb() {
  const nutzer = await holeAngemeldetenNutzer();
  if (!nutzer) redirect("/login");
  if (nutzer.rolle !== "admin") redirect("/dashboard");

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">
        Neuer Betrieb
      </h1>
      <BetriebFormular aktion={betriebAnlegen} knopfbeschriftung="Anlegen" />
    </main>
  );
}
