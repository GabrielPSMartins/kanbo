import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Burndown } from '@/api/client'
import { fmtShort, todayISO } from '@/lib/dates'
import { ChartLegend, ChartTooltipBox, LineSwatch } from './chart-tooltip'
import { useChartColors } from './colors'

type Point = Burndown['points'][number]

/** Burndown: pontos restantes (real) vs linha ideal. */
export function BurndownChart({
  data,
  height = 280,
  compact = false,
}: {
  data: Burndown
  height?: number
  compact?: boolean
}) {
  const c = useChartColors()
  const today = todayISO()
  const showToday = data.points.some((p) => p.date === today)
  const fmt = (v: number | null | undefined) => (v == null ? '—' : `${Math.round(v * 10) / 10} pts`)

  return (
    <div className="space-y-2">
      {!compact && (
        <ChartLegend
          items={[
            { label: 'Restante (real)', swatch: <LineSwatch color={c.primary} /> },
            { label: 'Ideal', swatch: <LineSwatch color={c.reference} dashed /> },
          ]}
        />
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data.points} margin={{ top: 8, right: 12, bottom: 0, left: compact ? -24 : -12 }}>
          <CartesianGrid vertical={false} stroke={c.grid} />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => fmtShort(d)}
            tick={{ fill: c.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: c.grid }}
            minTickGap={24}
          />
          <YAxis
            tick={{ fill: c.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={48}
          />
          {showToday && (
            <ReferenceLine
              x={today}
              stroke={c.today}
              strokeOpacity={0.35}
              strokeDasharray="2 3"
              label={compact ? undefined : { value: 'hoje', position: 'insideTopRight', fill: c.axis, fontSize: 11 }}
            />
          )}
          <Tooltip
            cursor={{ stroke: c.axis, strokeOpacity: 0.4 }}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as Point | undefined
              if (!active || !p) return null
              return (
                <ChartTooltipBox
                  title={fmtShort(p.date)}
                  rows={[
                    { label: 'Restante', value: fmt(p.remaining), swatch: <LineSwatch color={c.primary} /> },
                    { label: 'Ideal', value: fmt(p.ideal), swatch: <LineSwatch color={c.reference} dashed /> },
                  ]}
                />
              )
            }}
          />
          <Line
            dataKey="ideal"
            stroke={c.reference}
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
          <Line
            dataKey="remaining"
            stroke={c.primary}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, stroke: c.surface, strokeWidth: 2 }}
            connectNulls={false}
            isAnimationActive={false}
            type="linear"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
