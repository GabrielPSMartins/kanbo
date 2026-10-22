import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BoxSwatch, ChartLegend, ChartTooltipBox } from './chart-tooltip'
import { useChartColors } from './colors'

type Entry = { name: string; committed: number; completed: number }

/** Velocity: pontos comprometidos vs entregues por sprint fechada. */
export function VelocityChart({ data, height = 220 }: { data: Entry[]; height?: number }) {
  const c = useChartColors()
  return (
    <div className="space-y-2">
      <ChartLegend
        items={[
          { label: 'Entregue', swatch: <BoxSwatch color={c.primary} /> },
          { label: 'Comprometido', swatch: <BoxSwatch color={c.reference} /> },
        ]}
      />
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} barGap={2} barCategoryGap="30%" margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid vertical={false} stroke={c.grid} />
          <XAxis dataKey="name" tick={{ fill: c.axis, fontSize: 11 }} tickLine={false} axisLine={{ stroke: c.grid }} />
          <YAxis
            tick={{ fill: c.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={48}
          />
          <Tooltip
            cursor={{ fill: c.grid, fillOpacity: 0.4 }}
            content={({ active, payload }) => {
              const e = payload?.[0]?.payload as Entry | undefined
              if (!active || !e) return null
              const pct = e.committed ? Math.round((e.completed / e.committed) * 100) : 0
              return (
                <ChartTooltipBox
                  title={e.name}
                  rows={[
                    { label: 'Entregue', value: `${e.completed} pts`, swatch: <BoxSwatch color={c.primary} /> },
                    { label: 'Comprometido', value: `${e.committed} pts`, swatch: <BoxSwatch color={c.reference} /> },
                    { label: 'Taxa', value: `${pct}%`, swatch: <span className="size-2.5" /> },
                  ]}
                />
              )
            }}
          />
          <Bar
            dataKey="committed"
            fill={c.reference}
            fillOpacity={0.55}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
            isAnimationActive={false}
          />
          <Bar dataKey="completed" fill={c.primary} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
