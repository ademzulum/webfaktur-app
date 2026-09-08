"use client";

import {
  Bar,
  BarChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { centAlsEuro } from "@/lib/geld";

export type Kampagnenwert = {
  name: string;
  cent: number;
  anrufe: number;
};

/**
 * Auftragswert je Kampagne, als liegende Balken.
 *
 * Bewusst liegend statt stehend: Kampagnennamen sind lang, und liegende
 * Balken geben ihnen Platz, ohne die Beschriftung zu kippen.
 *
 * Bewusst nur EINE Kennzahl. Zwei Größen mit unterschiedlichen Maßstäben
 * (etwa Anrufe und Euro) in ein Diagramm mit zwei Achsen zu legen, ist die
 * häufigste Irreführung überhaupt - die Balkenlängen wären dann nicht mehr
 * vergleichbar. Die Anzahl steht deshalb im Hinweisfeld beim Überfahren.
 *
 * Bewusst nur EINE Farbe. Es wird eine einzige Größe gezeigt, also gibt es
 * nichts zu unterscheiden. Verschiedene Farben je Balken würden eine
 * Bedeutung vortäuschen, die die Daten nicht haben.
 */
export function KampagnenDiagramm({ daten }: { daten: Kampagnenwert[] }) {
  // Namen kürzen, damit ein langer Name nicht die halbe Breite frisst.
  const kuerzen = (name: string) =>
    name.length > 22 ? name.slice(0, 21) + "…" : name;

  return (
    <div style={{ height: Math.max(180, daten.length * 52 + 24) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={daten}
          layout="vertical"
          margin={{ top: 4, right: 100, bottom: 4, left: 4 }}
          barCategoryGap={12}
        >
          <defs>
            {/* Leichter Verlauf zur Spitze hin. Gleiche Farbe, nur etwas
                zurückgenommen - der Balken bekommt dadurch Tiefe, ohne dass
                das Ende schlechter ablesbar wird. */}
            <linearGradient id="balkenverlauf" x1="0" y1="0" x2="1" y2="0">
              <stop
                offset="0%"
                stopColor="var(--color-chart-1)"
                stopOpacity={1}
              />
              <stop
                offset="100%"
                stopColor="var(--color-chart-1)"
                stopOpacity={0.78}
              />
            </linearGradient>
          </defs>

          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={170}
            tickLine={false}
            axisLine={false}
            tickFormatter={kuerzen}
            tick={{
              fill: "var(--color-muted-foreground)",
              fontSize: 12,
              fontFamily: "var(--font-dm-mono)",
            }}
          />
          <Tooltip
            cursor={false}
            content={<Hinweisfeld />}
            animationDuration={160}
          />
          <Bar
            dataKey="cent"
            fill="url(#balkenverlauf)"
            radius={[0, 4, 4, 0]}
            barSize={14}
            // Die blasse Spur hinter jedem Balken ersetzt die Hilfslinien.
            // Sie zeigt, wie weit es überhaupt gehen könnte - dadurch ist
            // auch ein kurzer Balken als "wenig" lesbar und nicht nur als
            // kurzer Strich im Nichts.
            background={{ fill: "var(--color-muted)", radius: 4 }}
            animationDuration={700}
            animationEasing="ease-out"
          >
            {/* Wert direkt am Balken. Bei wenigen Balken ist das lesbarer
                als eine Achse mit Zahlen darunter. */}
            <LabelList
              dataKey="cent"
              position="right"
              offset={12}
              className="fill-foreground"
              fontSize={12}
              fontFamily="var(--font-dm-mono)"
              formatter={(wert: unknown) => centAlsEuro(Number(wert))}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Hinweisfeld({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Kampagnenwert }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const eintrag = payload[0].payload;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-lg">
      <div className="flex items-center gap-2">
        <span className="size-2 shrink-0 rounded-full bg-[var(--color-chart-1)]" />
        <p className="text-sm">{eintrag.name}</p>
      </div>
      <p className="mt-1.5 text-base tabular-nums">
        {centAlsEuro(eintrag.cent)}
      </p>
      <p className="text-xs text-muted-foreground">
        aus {eintrag.anrufe} {eintrag.anrufe === 1 ? "Anruf" : "Anrufen"}
      </p>
    </div>
  );
}
