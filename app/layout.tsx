import type { Metadata } from "next";
import { DM_Mono, Newsreader } from "next/font/google";

import { Hintergrunddienst } from "@/components/hintergrunddienst";
import { LEISTENFARBE, THEME_SPEICHER } from "@/lib/theme";

import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  // Nur die zwei Strichstaerken, die tatsaechlich vorkommen. Jede weitere
  // waere eine zusaetzliche Datei, die der Besucher herunterlaedt, ohne dass
  // sie je zu sehen ist.
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Webfaktur",
  description:
    "Anrufe aus Google Ads bewerten und als Auftragswert zurückmelden.",

  // Sorgt dafür, dass sich Webfaktur auf dem iPhone wie eine App verhält:
  // ohne Adressleiste, mit eigenem Namen unter dem Symbol. Apple wertet das
  // Manifest dafür nicht aus, es braucht diese eigenen Angaben.
  appleWebApp: {
    capable: true,
    title: "Webfaktur",
    statusBarStyle: "black",
  },
};

/**
 * Läuft, bevor die Seite gezeichnet wird.
 *
 * Ohne das würde beim Laden kurz die helle Ansicht aufblitzen, bevor React
 * übernimmt - besonders unangenehm, weil dunkel die Voreinstellung ist.
 * Deshalb bewusst ein einfaches Skript im Kopfbereich und nicht React.
 *
 * Es setzt AUCH die Farbe der Systemleiste. Bewusst hier und nicht über die
 * Metadaten von Next.js: Von dort käme ein fester Wert, der sich beim
 * Umschalten nicht mitändert. Und wären es zwei Angaben - eine feste und
 * eine gesetzte -, nähme der Browser die erste, was nur am Telefon
 * auffiele.
 */
const themeSkript = `
(function () {
  var dunkel = true;
  try {
    dunkel = localStorage.getItem(${JSON.stringify(THEME_SPEICHER)}) !== "hell";
  } catch (e) {
    // Manche Browser sperren den Speicher. Dann gilt die Voreinstellung.
  }

  document.documentElement.classList.toggle("dark", dunkel);

  var angabe = document.querySelector('meta[name="theme-color"]');
  if (!angabe) {
    angabe = document.createElement("meta");
    angabe.setAttribute("name", "theme-color");
    document.head.appendChild(angabe);
  }
  angabe.setAttribute(
    "content",
    dunkel ? ${JSON.stringify(LEISTENFARBE.dunkel)} : ${JSON.stringify(LEISTENFARBE.hell)}
  );
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      // "dark" steht schon hier, damit der vom Server gelieferte Zustand der
      // Voreinstellung entspricht und beim Laden nichts umspringt.
      className={`dark ${newsreader.variable} ${dmMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeSkript }} />
      </head>
      <body className="flex min-h-full flex-col">
        {children}
        <Hintergrunddienst />
      </body>
    </html>
  );
}
