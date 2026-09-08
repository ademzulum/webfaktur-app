import { Wortmarke } from "@/components/marke/wortmarke";

/**
 * Wird gezeigt, wenn die Seite ohne Verbindung geöffnet wird.
 *
 * Bewusst ohne jede Funktion und ohne Daten: Diese Seite wird beim ersten
 * Besuch mitgespeichert und liegt danach auf dem Telefon. Alles, was hier
 * stünde, läge damit auch ohne Anmeldung offen - deshalb steht hier nichts
 * als ein Hinweis.
 */
export const metadata = { title: "Keine Verbindung" };

export default function Ohneverbindung() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-10 text-center">
      <Wortmarke className="mx-auto h-9 w-auto" />
      <h1 className="mt-10 text-2xl font-semibold tracking-tight">
        Keine Verbindung
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Webfaktur braucht Internet, um Anrufe zu laden. Sobald du wieder Empfang
        hast, lädt die Seite von selbst weiter.
      </p>
    </main>
  );
}
