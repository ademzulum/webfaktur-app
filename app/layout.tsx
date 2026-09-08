import type { Metadata, Viewport } from "next";
import { DM_Mono, Newsreader } from "next/font/google";

import { Hintergrunddienst } from "@/components/hintergrunddienst";

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
 * Die Farbe der Systemleiste, wenn Webfaktur vom Startbildschirm gestartet
 * wird. Bewusst der dunkle Hintergrund: Dunkel ist die Voreinstellung, und
 * die Leiste soll nahtlos in die Seite übergehen.
 */
export const viewport: Viewport = {
  themeColor: "#0a0a0b",
};

/**
 * Läuft, bevor die Seite gezeichnet wird.
 *
 * Ohne das würde beim Laden kurz die helle Ansicht aufblitzen, bevor React
 * übernimmt - besonders unangenehm, weil dunkel die Voreinstellung ist.
 * Deshalb bewusst ein einfaches Skript im Kopfbereich und nicht React.
 */
const themeSkript = `
(function () {
  try {
    var gewaehlt = localStorage.getItem("webfaktur-theme");
    if (gewaehlt === "hell") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {
    document.documentElement.classList.add("dark");
  }
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
