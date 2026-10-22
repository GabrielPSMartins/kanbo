import { useTheme } from '@/providers/theme'

/**
 * Cores dos gráficos em hex (atributos SVG não resolvem var() de forma confiável).
 * Série principal = indigo da marca; série de referência (ideal / comprometido) = cinza neutro
 * com tracejado ou legenda — par validado (CVD ΔE ≥ 18 nos dois temas).
 */
export function useChartColors() {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  return {
    primary: '#6366F1',
    reference: dark ? '#8B93A7' : '#5B6478',
    grid: dark ? '#242A36' : '#E4E7EC',
    axis: dark ? '#8B93A7' : '#5B6478',
    surface: dark ? '#12151C' : '#FFFFFF',
    today: dark ? '#E6E8EE' : '#0F1320',
  }
}
