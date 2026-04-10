export const COLORS = {
  cyan: '#00d4ff',
  green: '#00ff88',
  warning: '#ffb800',
  danger: '#ff4757',
  purple: '#8b5cf6',
  blue: '#3b82f6',

  centralized: '#3b82f6',
  distributed: '#8b5cf6',
  federated: '#00d4ff',

  ecgClasses: ['#00d4ff', '#00ff88', '#ffb800', '#ff4757', '#8b5cf6'],
  harActivities: ['#00d4ff', '#00ff88', '#ffb800', '#ff4757', '#8b5cf6', '#f97316'],

  clientColors: ['#00d4ff', '#00ff88', '#ffb800', '#ff4757', '#8b5cf6', '#f97316', '#ec4899', '#14b8a6', '#a855f7', '#06b6d4'],

  nodeState: {
    idle: '#374151',
    training: '#f59e0b',
    sending: '#00d4ff',
    done: '#00ff88'
  }
}

export function getClientColor(id: number): string {
  return COLORS.clientColors[id % COLORS.clientColors.length]
}

export function interpolateColor(value: number, min = 0, max = 1): string {
  const t = (value - min) / (max - min)
  if (t < 0.5) {
    const r = Math.round(255 * (t * 2))
    return `rgb(${r}, ${Math.round(255 * (1 - t * 2))}, 0)`
  }
  return `rgb(255, ${Math.round(255 * ((1 - t) * 2))}, 0)`
}

export function heatmapColor(value: number, max: number): string {
  const t = max > 0 ? value / max : 0
  const r = Math.round(t * 0 + (1 - t) * 13)
  const g = Math.round(t * 212 + (1 - t) * 20)
  const b = Math.round(t * 255 + (1 - t) * 36)
  return `rgba(${r}, ${g}, ${b}, ${0.2 + t * 0.8})`
}
