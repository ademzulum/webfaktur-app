"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
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
 */
export function KampagnenDiagramm({ daten }: { daten: Kampagnenwert[] }) {
  return (
    <div style={{ height: Math.max(160, daten.length * 44 + 24) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={daten}
          layout="vertical"
          margin={{ top: 4, right: 96, bottom: 4, left: 4 }}
          barCategoryGap={8}
        >
          {/* Nur senkrechte Hilfslinien, dezent - sie sollen die Balken
              stützen, nicht mit ihnen konkurrieren. */}
          <CartesianGrid
            horizontal={false}
            stroke="var(--color-border)"
            strokeDasharray="3 3"
          />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={170}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "var(--color-muted)", opacity: 0.5 }}
            content={<Hinweisfeld />}
          />
          <Bar
            dataKey="cent"
            fill="var(--color-chart-1)"
            radius={[0, 4, 4, 0]}
            barSize={18}
            isAnimationActive={false}
          >
            {/* Wert direkt am Balken. Bei wenigen Balken ist das lesbarer
                als eine Achse mit Zahlen darunter. */}
            <LabelList
              dataKey="cent"
              position="right"
              className="fill-foreground"
              fontSize={12}
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
    <div className="rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="text-sm font-medium">{eintrag.name}</p>
      <p className="mt-1 text-sm tabular-nums">{centAlsEuro(eintrag.cent)}</p>
      <p className="text-xs text-muted-foreground">
        aus {eintrag.anrufe} {eintrag.anrufe === 1 ? "Anruf" : "Anrufen"}
      </p>
    </div>
  );
}
