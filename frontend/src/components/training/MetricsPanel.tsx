import React from 'react'
import { AnimatedCounter } from '../ui/AnimatedCounter'

interface MetricsPanelProps {
  accuracy: number
  f1: number
  loss: number
  round?: number
  epoch?: number
  totalRounds?: number
  totalEpochs?: number
  commCostKb?: number
  mode?: 'federated' | 'centralized' | 'distributed'
}

function MetricItem({ label, value, color = '#00d4ff', unit = '', decimals = 1 }: {
  label: string; value: number; color?: string; unit?: string; decimals?: number
}) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: `1px solid ${color}22`,
      borderRadius: 8, padding: '10px 12px'
    }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontFamily: 'JetBrains Mono', fontWeight: 700, color, lineHeight: 1 }}>
        <AnimatedCounter value={value} decimals={decimals} suffix={unit} />
      </div>
    </div>
  )
}

export function MetricsPanel({
  accuracy, f1, loss, round, epoch, totalRounds, totalEpochs, commCostKb, mode = 'federated'
}: MetricsPanelProps) {
  const color = mode === 'federated' ? '#00d4ff' : mode === 'distributed' ? '#8b5cf6' : '#3b82f6'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <MetricItem label="Accuracy" value={accuracy * 100} color={color} unit="%" decimals={1} />
      <MetricItem label="F1 Score" value={f1} color="#00ff88" unit="" decimals={4} />
      <MetricItem label="Loss" value={loss} color="#ffb800" unit="" decimals={4} />

      {round !== undefined && totalRounds !== undefined && (
        <div style={{
          background: 'var(--bg-secondary)',
          border: `1px solid ${color}22`,
          borderRadius: 8, padding: '10px 12px'
        }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Progress
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono', marginBottom: 6 }}>
            {mode === 'federated' ? `Round ${round}/${totalRounds}` : `Epoch ${epoch ?? 0}/${totalEpochs ?? 0}`}
          </div>
          <div style={{ height: 6, background: 'var(--bg-card)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(((mode === 'federated' ? round : (epoch ?? 0)) / (mode === 'federated' ? totalRounds : (totalEpochs ?? 1))) * 100, 100)}%`,
              background: `linear-gradient(90deg, ${color}, ${color}88)`,
              borderRadius: 3,
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>
      )}

      {commCostKb !== undefined && commCostKb > 0 && (
        <MetricItem label="Comm. Cost" value={commCostKb / 1024} color="#8b5cf6" unit=" MB" decimals={2} />
      )}
    </div>
  )
}
