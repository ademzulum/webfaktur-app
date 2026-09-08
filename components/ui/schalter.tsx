/**
 * Ein Kippschalter.
 *
 * Ersetzt das eckige Häkchen-Kästchen des Browsers. Ein Häkchen sagt
 * "angehakt", ein Schalter sagt "an oder aus" - und genau das ist hier
 * gemeint.
 *
 * Darunter steckt trotzdem ein ganz normales Häkchen-Feld, nur unsichtbar.
 * Das ist wichtig: Das Formular schickt seinen Wert von selbst mit, die
 * Tastaturbedienung funktioniert ohne Zutun, und Vorleseprogramme kennen
 * das Feld. Nachgebaut wäre das alles verloren.
 */
export function Schalter({
  name,
  titel,
  hinweis,
  voreingestellt,
}: {
  name: string;
  titel: string;
  hinweis?: string;
  voreingestellt?: boolean;
}) {
  return (
    <label className="weich flex cursor-pointer items-center justify-between gap-4 rounded-xl border bg-card p-4 hover:border-primary/40 hover:bg-muted/20 has-[:focus-visible]:border-primary/50">
      <span className="min-w-0">
        <span className="block text-sm">{titel}</span>
        {hinweis ? (
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {hinweis}
          </span>
        ) : null}
      </span>

      <span className="relative inline-flex shrink-0">
        <input
          type="checkbox"
          name={name}
          defaultChecked={voreingestellt}
          className="peer sr-only"
        />
        {/* Die Schiene */}
        <span className="block h-6 w-11 rounded-full bg-input transition-colors duration-300 ease-[var(--ease-weich)] peer-checked:bg-primary" />
        {/* Der Knopf. Die federnde Kurve lässt ihn am Ende leicht
            überschwingen - dadurch wirkt das Umlegen körperlich. */}
        <span className="pointer-events-none absolute top-0.5 left-0.5 size-5 rounded-full bg-background shadow-sm transition-transform duration-[380ms] ease-[var(--ease-federnd)] peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
