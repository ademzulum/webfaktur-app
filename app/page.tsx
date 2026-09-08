import { redirect } from "next/navigation";

/**
 * Die Startseite.
 *
 * Das hier ist ein Werkzeug, keine Werbeseite. Wer die Adresse aufruft,
 * will sich anmelden - also wird er genau dorthin geschickt.
 *
 * Wer bereits angemeldet ist, bleibt nicht auf der Anmeldeseite hängen:
 * proxy.ts leitet ihn von dort direkt in die Übersicht weiter. Deshalb
 * muss hier nicht zusätzlich geprüft werden, wer gerade zugreift.
 */
export default function Startseite() {
  redirect("/login");
}
