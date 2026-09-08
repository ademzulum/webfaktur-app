import { CheckCircle2 } from "lucide-react";

export default function Danke() {
  return (
    <main className="auftauchen mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12 sm:py-16">
      <div className="rounded-lg border bg-card p-8 text-center">
        <div className="flex justify-center">
          <CheckCircle2 className="size-12 text-emerald-600 dark:text-emerald-500" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Danke!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Die Bewertung ist gespeichert. Du kannst dieses Fenster schließen.
        </p>
      </div>
    </main>
  );
}
