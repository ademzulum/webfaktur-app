import { Logomark } from "@/components/marke/logomark";

/**
 * Der Ladeschirm: Die Bildmarke wird gezeichnet, dann füllt sie sich, dann
 * blendet der Schirm weg.
 *
 * Reine CSS-Animation, kein Programm im Browser. Das ist hier wesentlich:
 * Würde ein Programm den Schirm steuern, erschiene er erst, NACHDEM dieses
 * geladen ist - also genau dann nicht, wenn man ihn braucht. So steht er
 * schon im ausgelieferten HTML und läuft vom ersten Bild an.
 *
 * Er hält nichts auf. Der Inhalt darunter ist längst da und wird nur
 * verdeckt; "pointer-events: none" sorgt dafür, dass man auch währenddessen
 * schon tippen kann.
 *
 * Bewusst NICHT auf der Bewertungsseite: Die verspricht zwei Taps. Eine
 * Sekunde Vorspann davor arbeitet gegen das Einzige, was diese Seite können
 * muss. Deshalb steht der Schirm nur im Dashboard und auf der Anmeldeseite.
 */
export function Ladeschirm() {
  return (
    <div className="ladeschirm" aria-hidden>
      <Logomark className="ladeschirm-marke" />
    </div>
  );
}
