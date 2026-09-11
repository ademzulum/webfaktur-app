import { redirect } from "next/navigation";

import { abmelden } from "@/app/login/actions";
import { Kopfleiste, type Menuepunkt } from "@/components/kopfleiste";
import { holeAngemeldetenNutzer } from "@/lib/nutzer";

/**
 * Rahmen für alle Seiten unterhalb von /dashboard.
 *
 * Die Kopfleiste steht dadurch auf jeder dieser Seiten, ohne dass sie in
 * jeder einzelnen eingebunden werden müsste. Welche Punkte erscheinen,
 * hängt an der Rolle - ein Betriebsnutzer sieht die Verwaltungspunkte
 * gar nicht erst.
 *
 * Das ersetzt aber KEINE Zugriffsprüfung: Jede Seite prüft weiterhin selbst,
 * ob sie aufgerufen werden darf. Ein Menüpunkt auszublenden ist Bequemlichkeit,
 * keine Absicherung.
 */
export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const nutzer = await holeAngemeldetenNutzer();
  if (!nutzer) redirect("/login");

  const punkte: Menuepunkt[] = [
    { titel: "Übersicht", pfad: "/dashboard" },
    { titel: "Anrufe", pfad: "/dashboard/anrufe" },
  ];

  // Das Ausblenden der Kostenseite ist Bequemlichkeit, kein Schutz. Wer die
  // Adresse errät, kommt trotzdem nicht an die Zahlen: Die Zugriffsregeln der
  // Datenbank liefern ihm nichts. Nachgewiesen in kostenschutz-pruefen.sql.
  if (nutzer.rolle === "admin") {
    punkte.push(
      { titel: "Betriebe", pfad: "/dashboard/betriebe" },
      { titel: "Kosten", pfad: "/dashboard/kosten" },
      { titel: "SMS", pfad: "/dashboard/sms-test" },
    );
  }

  return (
    <>
      <Kopfleiste punkte={punkte} abmelden={abmelden} />
      <div className="flex flex-1 flex-col">{children}</div>
    </>
  );
}
