import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import type { EpochMetric, RoundMetric } from '../../types/training'

interface TrainingCurveProps {
  epochHistory?: EpochMetric[]
  roundHistory?: RoundMetric[]
  mode?: 'loss' | 'accuracy' | 'both'
  height?: number
  showRounds?: boolean
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
      borderRadius: 8, padding: '10px 14px', fontSize: 12, fontFamily: 'JetBrains Mono'
    }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>
        {label !== undefined ? (payload[0]?.name?.includes('Round') ? `Round ${label}` : `Epoch ${label}`) : ''}
      </p>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(4) : p.value}
        </div>
      ))}
    </div>
  )
}

export function TrainingCurve({ epochHistory = [], roundHistory = [], mode = 'both', height = 200, showRounds = false }: TrainingCurveProps) {
  const data = showRounds
    ? roundHistory.map(r => ({
        round: r.round,
        accuracy: +(r.accuracy * 100).toFixed(2),
        loss: +r.loss.toFixed(4),
        f1: +r.f1_score.toFixed(4)
      }))
    : epochHistory.map(e => ({
        epoch: e.epoch,
        trainLoss: +e.train_loss.toFixed(4),
        valLoss: +e.val_loss.toFixed(4),
        valAccuracy: +(e.val_accuracy * 100).toFixed(2),
        valF1: +e.val_f1.toFixed(4)
      }))

  if (data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>No training data yet</span>
      </div>
    )
  }

  const xKey = showRounds ? 'round' : 'epoch'

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey={xKey}
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          label={{ value: showRounds ? 'Round' : 'Epoch', position: 'insideBottom', offset: -2, fill: '#94a3b8', fontSize: 10 }}
        />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 4 }}
        />
        {!showRounds && (mode === 'loss' || mode === 'both') && (
          <>
            <Line type="monotone" dataKey="trainLoss" name="Train Loss" stroke="#3b82f6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="valLoss" name="Val Loss" stroke="#8b5cf6" strokeWidth={2} dot={false} />
          </>
        )}
        {!showRounds && (mode === 'accuracy' || mode === 'both') && (
          <Line type="monotone" dataKey="valAccuracy" name="Val Accuracy %" stroke="#00d4ff" strokeWidth={2} dot={false} />
        )}
        {showRounds && (
          <>
            <Line type="monotone" dataKey="accuracy" name="Accuracy %" stroke="#00d4ff" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="loss" name="Loss" stroke="#ff4757" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            <Line type="monotone" dataKey="f1" name="F1 Score" stroke="#00ff88" strokeWidth={1.5} dot={false} />
          </>
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}
