/**
 * Eine Reihe von Auswahlmöglichkeiten, von denen genau eine gilt.
 *
 * Statt eines Eingabefelds, in das man den Paketnamen tippen muss: Man
 * sieht sofort, welche Möglichkeiten es gibt, und kann sich nicht
 * verschreiben.
 *
 * Darunter liegen normale Auswahlknöpfe (Radio-Felder), nur unsichtbar.
 * Damit schickt das Formular den Wert von selbst mit und die Bedienung
 * per Tastatur funktioniert ohne Zutun.
 */
export function Auswahlreihe({
  name,
  optionen,
  gewaehlt,
}: {
  name: string;
  optionen: { wert: string; titel: string }[];
  gewaehlt: string;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl border bg-muted/40 p-1">
      {optionen.map((option) => (
        <label key={option.wert} className="relative">
          <input
            type="radio"
            name={name}
            value={option.wert}
            defaultChecked={option.wert === gewaehlt}
            className="peer sr-only"
          />
          <span className="weich block cursor-pointer rounded-lg px-4 py-2 text-sm text-muted-foreground peer-checked:bg-card peer-checked:text-foreground peer-checked:shadow-sm peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 hover:text-foreground">
            {option.titel}
          </span>
        </label>
      ))}
    </div>
  );
}
