import React, { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts'
import { motion } from 'framer-motion'
import type { PartitionClientStat } from '../../types/training'
import { getClientColor, COLORS } from '../../utils/colors'

interface DataPartitionPanelProps {
  /** Live stats received from the backend via WS (partition_info message) */
  partitionStats: PartitionClientStat[]
  partitionClasses: string[]
  /** Config-driven fallback if backend hasn't sent stats yet */
  nClients?: number
  iid?: boolean
  datasetType?: string
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function classColor(i: number): string {
  return COLORS.ecgClasses[i % COLORS.ecgClasses.length]
}

/** Gini coefficient: 0 = perfectly balanced, 1 = fully concentrated */
function gini(dist: Record<number, number>): number {
  const vals = Object.values(dist)
  const n = vals.length
  if (n === 0) return 0
  const total = vals.reduce((a, b) => a + b, 0)
  if (total === 0) return 0
  const sorted = [...vals].sort((a, b) => a - b)
  let num = 0
  sorted.forEach((v, i) => { num += (2 * (i + 1) - n - 1) * v })
  return Math.abs(num) / (n * total)
}

// ──────────────────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────────────────

function ClientDonut({ stat, classNames }: { stat: PartitionClientStat; classNames: string[] }) {
  const color = getClientColor(stat.client_id)
  const pieData = Object.entries(stat.class_distribution).map(([cls, cnt]) => ({
    name: classNames[+cls] ?? `C${cls}`,
    value: cnt,
    fill: classColor(+cls),
  }))

  const balance = (1 - gini(stat.class_distribution)) * 100

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: stat.client_id * 0.06 }}
      style={{
        background: 'var(--bg-secondary)',
        border: `1px solid ${color}33`,
        borderRadius: 10,
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {/* Client badge */}
      <div style={{
        fontSize: 11, fontFamily: 'JetBrains Mono', fontWeight: 700,
        color, marginBottom: 2
      }}>Client {stat.client_id}</div>

      {/* Donut */}
      <PieChart width={90} height={70}>
        <Pie
          data={pieData}
          cx={44} cy={34}
          innerRadius={20} outerRadius={32}
          dataKey="value"
          strokeWidth={0}
        >
          {pieData.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', fontSize: 10 }}
          formatter={(v: number, name: string) => [`${v} samples`, name]}
        />
      </PieChart>

      {/* Stats */}
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', fontFamily: 'JetBrains Mono' }}>
        {stat.n_samples.toLocaleString()} samples
      </div>

      {/* Balance bar */}
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)', marginBottom: 2 }}>
          <span>Balance</span>
          <span style={{ color: balance > 60 ? '#00ff88' : balance > 30 ? '#ffb800' : '#ff4757' }}>
            {balance.toFixed(0)}%
          </span>
        </div>
        <div style={{ height: 3, background: 'var(--bg-card)', borderRadius: 2 }}>
          <div style={{
            height: '100%',
            width: `${balance}%`,
            background: balance > 60 ? '#00ff88' : balance > 30 ? '#ffb800' : '#ff4757',
            borderRadius: 2
          }} />
        </div>
      </div>

      {/* Dominant classes */}
      {stat.dominant_classes.length > 0 && (
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
          {stat.dominant_classes.map(c => (
            <span key={c} style={{
              fontSize: 8, fontFamily: 'JetBrains Mono',
              background: `${classColor(c)}22`,
              color: classColor(c),
              border: `1px solid ${classColor(c)}44`,
              padding: '1px 5px', borderRadius: 3
            }}>
              {classNames[c] ?? `C${c}`}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────────────────

type View = 'stacked' | 'clients' | 'table'

export function DataPartitionPanel({
  partitionStats,
  partitionClasses,
  nClients = 5,
  iid = true,
  datasetType = 'ecg',
}: DataPartitionPanelProps) {
  const [view, setView] = useState<View>('stacked')

  const hasData = partitionStats.length > 0

  // Fallback class names when backend hasn't responded yet
  const ecgFallback = ['Normal', 'Supra.', 'Ventr.', 'Fusion', 'Unknown']
  const harFallback = ['Walking', 'Walk Up', 'Walk Down', 'Sitting', 'Standing', 'Laying']
  const classNames = partitionClasses.length > 0
    ? partitionClasses
    : (datasetType === 'har' ? harFallback : ecgFallback)

  // Build stacked-bar data: each row = one client, each stack segment = one class
  const stackedData = partitionStats.map(stat => {
    const row: Record<string, number | string> = { client: `C${stat.client_id}` }
    classNames.forEach((name, i) => {
      row[name] = stat.class_distribution[i] ?? 0
    })
    return row
  })

  // Total samples per class across all clients (for distribution overview)
  const globalClassDist = classNames.map((name, i) => ({
    name,
    total: partitionStats.reduce((s, stat) => s + (stat.class_distribution[i] ?? 0), 0),
    fill: classColor(i)
  }))

  // Summary stats
  const totalSamples = partitionStats.reduce((s, p) => s + p.n_samples, 0)
  const avgSamples = partitionStats.length ? totalSamples / partitionStats.length : 0
  const minSamples = partitionStats.length ? Math.min(...partitionStats.map(p => p.n_samples)) : 0
  const maxSamples = partitionStats.length ? Math.max(...partitionStats.map(p => p.n_samples)) : 0

  const views: { id: View; label: string }[] = [
    { id: 'stacked', label: 'Stacked Bar' },
    { id: 'clients', label: 'Per-Client Donuts' },
    { id: 'table',   label: 'Data Table' },
  ]

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
      borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          DATA PARTITION — {iid ? 'IID' : 'NON-IID'} SPLIT ACROSS {nClients} CLIENTS
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {views.map(v => (
            <button key={v.id} onClick={() => setView(v.id)} style={{
              padding: '3px 10px', fontSize: 10, fontFamily: 'JetBrains Mono',
              background: view === v.id ? 'rgba(0,255,136,0.12)' : 'transparent',
              border: `1px solid ${view === v.id ? 'rgba(0,255,136,0.4)' : 'rgba(255,255,255,0.08)'}`,
              color: view === v.id ? '#00ff88' : 'var(--text-muted)',
              borderRadius: 5, cursor: 'pointer'
            }}>{v.label}</button>
          ))}
        </div>
      </div>

      {/* Privacy callout */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px',
        background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)',
        borderRadius: 8
      }}>
        <span style={{ fontSize: 14 }}>🔒</span>
        <span style={{ fontSize: 11, color: '#00ff88' }}>
          Privacy guarantee: raw data <strong>never leaves</strong> each client device — only model weights are aggregated by the server.
        </span>
      </div>

      {/* Summary stat pills */}
      {hasData && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Samples', val: totalSamples.toLocaleString(), color: '#00d4ff' },
            { label: 'Avg per Client', val: avgSamples.toFixed(0), color: '#00ff88' },
            { label: 'Min / Max', val: `${minSamples} / ${maxSamples}`, color: '#ffb800' },
            { label: 'Split Mode', val: iid ? 'IID' : 'Non-IID', color: iid ? '#00ff88' : '#ff4757' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{
              background: 'var(--bg-secondary)', borderRadius: 7,
              border: `1px solid ${color}22`, padding: '5px 12px',
              display: 'flex', gap: 6, alignItems: 'baseline'
            }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}:</span>
              <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color, fontWeight: 700 }}>{val}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── No-data placeholder ── */}
      {!hasData && (
        <div style={{
          height: 200, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 10
        }}>
          <div style={{ fontSize: 32, opacity: 0.25 }}>🗂️</div>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            Partition data will appear automatically when training starts
          </span>
        </div>
      )}

      {/* ── Stacked bar view ── */}
      {hasData && view === 'stacked' && (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stackedData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="client" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} label={{ value: 'Samples', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 9 }} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', fontSize: 11 }}
              />
              <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
              {classNames.map((name, i) => (
                <Bar key={name} dataKey={name} stackId="s" fill={classColor(i)} radius={i === classNames.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>

          {/* Global class distribution mini row */}
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, fontFamily: 'Rajdhani', fontWeight: 600 }}>
              GLOBAL CLASS DISTRIBUTION (all clients combined)
            </div>
            <div style={{ display: 'flex', gap: 0, height: 16, borderRadius: 4, overflow: 'hidden' }}>
              {globalClassDist.map((d, i) => {
                const pct = totalSamples > 0 ? (d.total / totalSamples) * 100 : 0
                return (
                  <div
                    key={d.name}
                    title={`${d.name}: ${d.total} (${pct.toFixed(1)}%)`}
                    style={{ width: `${pct}%`, background: d.fill, minWidth: pct > 0 ? 2 : 0, transition: 'width 0.5s' }}
                  />
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
              {globalClassDist.map((d) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: d.fill }} />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Per-client donuts ── */}
      {hasData && view === 'clients' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(130px, 1fr))`,
          gap: 10
        }}>
          {partitionStats.map(stat => (
            <ClientDonut key={stat.client_id} stat={stat} classNames={classNames} />
          ))}
        </div>
      )}

      {/* ── Table view ── */}
      {hasData && view === 'table' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'JetBrains Mono' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '7px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Client</th>
                <th style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>Total</th>
                {classNames.map((name, i) => (
                  <th key={name} style={{ padding: '7px 8px', textAlign: 'right', color: classColor(i), fontWeight: 600 }}>
                    {name}
                  </th>
                ))}
                <th style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {partitionStats.map((stat, ri) => {
                const bal = (1 - gini(stat.class_distribution)) * 100
                const rowColor = getClientColor(stat.client_id)
                return (
                  <tr key={stat.client_id} style={{
                    borderBottom: ri < partitionStats.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                    background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'
                  }}>
                    <td style={{ padding: '6px 10px', color: rowColor, fontWeight: 700 }}>
                      Client {stat.client_id}
                    </td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: '#00d4ff' }}>
                      {stat.n_samples.toLocaleString()}
                    </td>
                    {classNames.map((_, i) => (
                      <td key={i} style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {stat.class_distribution[i] ?? 0}
                      </td>
                    ))}
                    <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                      <span style={{
                        color: bal > 60 ? '#00ff88' : bal > 30 ? '#ffb800' : '#ff4757',
                        fontWeight: 700
                      }}>
                        {bal.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {/* Totals row */}
            <tfoot>
              <tr style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '7px 10px', color: '#00d4ff', fontWeight: 700 }}>TOTAL</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', color: '#00d4ff', fontWeight: 700 }}>
                  {totalSamples.toLocaleString()}
                </td>
                {classNames.map((_, i) => (
                  <td key={i} style={{ padding: '7px 8px', textAlign: 'right', color: classColor(i), fontWeight: 700 }}>
                    {globalClassDist[i]?.total ?? 0}
                  </td>
                ))}
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
