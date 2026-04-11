import React, { useState } from 'react'
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart,
  BarChart
} from 'recharts'

interface ThroughputPoint { round: number; throughput_sps: number }
interface LatencyPoint {
  round: number
  round_time_ms: number
  agg_time_ms: number
  eval_time_ms: number
  avg_client_train_ms: number
  comm_latency_ms: number
}

interface ThroughputLatencyChartProps {
  throughputHistory: ThroughputPoint[]
  latencyHistory: LatencyPoint[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
      borderRadius: 8, padding: '10px 14px', fontSize: 11, fontFamily: 'JetBrains Mono'
    }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 6 }}>Round {label}</p>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</strong>
          {p.name.includes('sps') || p.name.includes('Throughput') ? ' sps' : ' ms'}
        </div>
      ))}
    </div>
  )
}

type Tab = 'throughput' | 'latency' | 'breakdown'

export function ThroughputLatencyChart({ throughputHistory, latencyHistory }: ThroughputLatencyChartProps) {
  const [tab, setTab] = useState<Tab>('throughput')

  const noData = throughputHistory.length === 0 && latencyHistory.length === 0

  // Merge throughput + latency by round for combined views
  const combined = latencyHistory.map(l => {
    const t = throughputHistory.find(th => th.round === l.round)
    return { ...l, throughput_sps: t?.throughput_sps ?? 0 }
  })

  const tabs: { id: Tab; label: string }[] = [
    { id: 'throughput', label: 'Throughput' },
    { id: 'latency',    label: 'End-to-End Latency' },
    { id: 'breakdown',  label: 'Time Breakdown' },
  ]

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
      borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          THROUGHPUT &amp; LATENCY ANALYSIS
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '3px 10px', fontSize: 10, fontFamily: 'JetBrains Mono',
              background: tab === t.id ? 'rgba(0,212,255,0.15)' : 'transparent',
              border: `1px solid ${tab === t.id ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
              color: tab === t.id ? '#00d4ff' : 'var(--text-muted)',
              borderRadius: 5, cursor: 'pointer'
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {noData ? (
        <div style={{ height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ fontSize: 28, opacity: 0.3 }}>📡</div>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Metrics will appear here once training starts</span>
        </div>
      ) : (
        <>
          {/* ── Throughput tab ───────────────────────────────────────── */}
          {tab === 'throughput' && (
            <>
              {/* Summary cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  {
                    label: 'Peak Throughput',
                    value: `${Math.max(0, ...throughputHistory.map(t => t.throughput_sps)).toFixed(0)} sps`,
                    color: '#00ff88'
                  },
                  {
                    label: 'Avg Throughput',
                    value: throughputHistory.length
                      ? `${(throughputHistory.reduce((s, t) => s + t.throughput_sps, 0) / throughputHistory.length).toFixed(0)} sps`
                      : '— sps',
                    color: '#00d4ff'
                  },
                  {
                    label: 'Latest Round',
                    value: throughputHistory.length
                      ? `${throughputHistory[throughputHistory.length - 1].throughput_sps.toFixed(0)} sps`
                      : '— sps',
                    color: '#ffb800'
                  },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{
                    background: 'var(--bg-secondary)', borderRadius: 8,
                    border: `1px solid ${color}22`, padding: '8px 10px'
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 16, fontFamily: 'JetBrains Mono', color, fontWeight: 700 }}>{value}</div>
                  </div>
                ))}
              </div>

              <ResponsiveContainer width="100%" height={170}>
                <AreaChart data={throughputHistory} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <defs>
                    <linearGradient id="tpGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00ff88" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="round" tick={{ fill: '#94a3b8', fontSize: 10 }} label={{ value: 'Round', position: 'insideBottom', offset: -2, fill: '#94a3b8', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} unit=" sps" width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone" dataKey="throughput_sps" name="Throughput"
                    stroke="#00ff88" strokeWidth={2}
                    fill="url(#tpGrad)" dot={{ r: 3, fill: '#00ff88' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>
                sps = samples processed per second across all clients (local training only, excludes communication)
              </p>
            </>
          )}

          {/* ── End-to-end latency tab ───────────────────────────────── */}
          {tab === 'latency' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  {
                    label: 'Avg Round Time',
                    value: latencyHistory.length
                      ? `${(latencyHistory.reduce((s, l) => s + l.round_time_ms, 0) / latencyHistory.length).toFixed(0)} ms`
                      : '—',
                    color: '#00d4ff'
                  },
                  {
                    label: 'Avg Agg. Latency',
                    value: latencyHistory.length
                      ? `${(latencyHistory.reduce((s, l) => s + l.agg_time_ms, 0) / latencyHistory.length).toFixed(1)} ms`
                      : '—',
                    color: '#ffb800'
                  },
                  {
                    label: 'Avg Comm. Latency',
                    value: latencyHistory.length
                      ? `${(latencyHistory.reduce((s, l) => s + l.comm_latency_ms, 0) / latencyHistory.length).toFixed(0)} ms`
                      : '—',
                    color: '#8b5cf6'
                  },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{
                    background: 'var(--bg-secondary)', borderRadius: 8,
                    border: `1px solid ${color}22`, padding: '8px 10px'
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 16, fontFamily: 'JetBrains Mono', color, fontWeight: 700 }}>{value}</div>
                  </div>
                ))}
              </div>

              <ResponsiveContainer width="100%" height={170}>
                <ComposedChart data={latencyHistory} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="round" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} unit=" ms" width={55} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="round_time_ms" name="Total Round (ms)" stroke="#00d4ff" strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="avg_client_train_ms" name="Avg Train (ms)" stroke="#00ff88" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                  <Line type="monotone" dataKey="comm_latency_ms" name="Comm (ms)" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="2 3" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </>
          )}

          {/* ── Time breakdown (stacked bar) tab ────────────────────── */}
          {tab === 'breakdown' && (
            <>
              <div style={{
                display: 'flex', gap: 12, padding: '8px 12px',
                background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)',
                borderRadius: 8, fontSize: 11, color: 'var(--text-secondary)'
              }}>
                <span style={{ color: '#00ff88' }}>■ Client Training</span>
                <span style={{ color: '#ffb800' }}>■ FedAvg Aggregation</span>
                <span style={{ color: '#8b5cf6' }}>■ Evaluation</span>
                <span style={{ color: '#00d4ff' }}>■ Communication</span>
              </div>

              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={latencyHistory} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="round" tick={{ fill: '#94a3b8', fontSize: 10 }} label={{ value: 'Round', position: 'insideBottom', offset: -2, fill: '#94a3b8', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} unit=" ms" width={55} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="avg_client_train_ms" name="Training (ms)" stackId="t" fill="#00ff88" fillOpacity={0.85} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="agg_time_ms"         name="Aggregation (ms)" stackId="t" fill="#ffb800" fillOpacity={0.85} />
                  <Bar dataKey="eval_time_ms"        name="Evaluation (ms)" stackId="t" fill="#8b5cf6" fillOpacity={0.85} />
                  <Bar dataKey="comm_latency_ms"     name="Communication (ms)" stackId="t" fill="#00d4ff" fillOpacity={0.85} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>
                Communication latency is simulated (~1 ms/KB). Training time is measured precisely.
              </p>
            </>
          )}
        </>
      )}
    </div>
  )
}
