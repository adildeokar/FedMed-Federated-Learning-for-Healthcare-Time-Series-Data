import React from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, LineChart, Line
} from 'recharts'

interface ComparisonData {
  centralized?: { accuracy: number; f1: number; time: number }
  distributed?: { accuracy: number; f1: number; time: number }
  federated?: { accuracy: number; f1: number; time: number }
}

interface ComparisonRadarProps {
  data?: ComparisonData
  height?: number
}

const DEFAULT_DATA = {
  centralized: { accuracy: 0.912, f1: 0.908, time: 45 },
  distributed: { accuracy: 0.898, f1: 0.891, time: 28 },
  federated: { accuracy: 0.873, f1: 0.866, time: 120 }
}

export function ComparisonRadar({ data, height = 300 }: ComparisonRadarProps) {
  const d = { ...DEFAULT_DATA, ...data }

  const maxTime = Math.max(d.centralized.time, d.distributed.time, d.federated.time)

  const radarData = [
    { metric: 'Accuracy', centralized: d.centralized.accuracy * 100, distributed: d.distributed.accuracy * 100, federated: d.federated.accuracy * 100 },
    { metric: 'F1 Score', centralized: d.centralized.f1 * 100, distributed: d.distributed.f1 * 100, federated: d.federated.f1 * 100 },
    { metric: 'Speed', centralized: (1 - d.centralized.time / maxTime) * 100, distributed: (1 - d.distributed.time / maxTime) * 100, federated: (1 - d.federated.time / maxTime) * 100 },
    { metric: 'Privacy', centralized: 5, distributed: 20, federated: 95 },
    { metric: 'Scalability', centralized: 20, distributed: 70, federated: 90 },
  ]

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={radarData}>
        <PolarGrid stroke="rgba(255,255,255,0.1)" />
        <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#475569', fontSize: 9 }} />
        <Radar name="Centralized" dataKey="centralized" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
        <Radar name="Distributed" dataKey="distributed" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} strokeWidth={2} />
        <Radar name="Federated" dataKey="federated" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.2} strokeWidth={2} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
        <Tooltip
          contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', fontSize: 11 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}

export function ComparisonBarChart({ data, height = 250 }: ComparisonRadarProps) {
  const d = { ...DEFAULT_DATA, ...data }

  const barData = [
    { name: 'Accuracy %', Centralized: +(d.centralized.accuracy * 100).toFixed(1), Distributed: +(d.distributed.accuracy * 100).toFixed(1), Federated: +(d.federated.accuracy * 100).toFixed(1) },
    { name: 'F1 Score ×100', Centralized: +(d.centralized.f1 * 100).toFixed(1), Distributed: +(d.distributed.f1 * 100).toFixed(1), Federated: +(d.federated.f1 * 100).toFixed(1) },
  ]

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={barData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <YAxis domain={[75, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', fontSize: 11 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="Centralized" fill="#3b82f6" radius={[3, 3, 0, 0]} />
        <Bar dataKey="Distributed" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
        <Bar dataKey="Federated" fill="#00d4ff" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
