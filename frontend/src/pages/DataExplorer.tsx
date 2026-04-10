import React, { useState } from 'react'
import { useDatasetSamples, useDatasetInfo, useFederatedPartition } from '../hooks/useMetrics'
import { ECGMiniChart } from '../components/charts/ECGWaveform'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { COLORS } from '../utils/colors'

const ECG_CLASSES = ['N', 'S', 'V', 'F', 'Q']
const ECG_CLASS_NAMES = ['Normal', 'Supraventricular', 'Ventricular', 'Fusion', 'Unknown']
const HAR_CLASSES = ['Walking', 'Walk Up', 'Walk Down', 'Sitting', 'Standing', 'Laying']

export function DataExplorer() {
  const [dataset, setDataset] = useState<'ecg' | 'har'>('ecg')
  const [nClients, setNClients] = useState(5)
  const [iid, setIid] = useState(true)

  const { data: samples } = useDatasetSamples(dataset)
  const { data: info } = useDatasetInfo(dataset)
  const { data: partition } = useFederatedPartition(dataset, nClients, iid)

  const isECG = dataset === 'ecg'
  const classNames = isECG ? ECG_CLASS_NAMES : HAR_CLASSES

  const distributionData = classNames.map((name, i) => ({
    name,
    value: isECG ? 1000 : 666
  }))

  const partitionBarData = partition?.partitions?.map((p: any) => {
    const obj: any = { client: `C${p.client_id}` }
    Object.entries(p.class_distribution ?? {}).forEach(([cls, cnt]) => {
      obj[classNames[+cls] ?? `C${cls}`] = cnt
    })
    return obj
  }) ?? []

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Dataset toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 20, color: 'var(--text-primary)' }}>
          Dataset Explorer
        </span>
        <div style={{
          display: 'flex', background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 2
        }}>
          {(['ecg', 'har'] as const).map(d => (
            <button key={d} onClick={() => setDataset(d)} style={{
              padding: '6px 18px', fontSize: 12, fontWeight: 600,
              borderRadius: 6, border: 'none', cursor: 'pointer',
              background: dataset === d ? 'rgba(0,212,255,0.15)' : 'transparent',
              color: dataset === d ? '#00d4ff' : 'var(--text-muted)'
            }}>
              {d === 'ecg' ? 'ECG — MIT-BIH' : 'HAR — Wearable'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      {info && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Train Samples', value: info.train_samples?.toLocaleString() ?? '—' },
            { label: 'Test Samples', value: info.test_samples?.toLocaleString() ?? '—' },
            { label: 'Classes', value: info.n_classes },
            { label: isECG ? 'Sample Length' : 'Sequence Length', value: (isECG ? info.sample_length : info.sequence_length) ?? '—' }
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderRadius: 10, padding: '12px 16px'
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 20, fontFamily: 'JetBrains Mono', color: '#00d4ff', fontWeight: 700 }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Signal samples */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 12, padding: '16px'
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14, fontFamily: 'Rajdhani', fontWeight: 600 }}>
            {isECG ? 'ECG SIGNAL SAMPLES — PER CLASS' : 'WEARABLE SENSOR SIGNALS — PER ACTIVITY'}
          </div>
          {classNames.map((name, ci) => {
            const classKey = isECG ? ECG_CLASSES[ci] : name
            const sampleList: number[][] = samples?.samples?.[classKey] ?? []
            const sample: number[] = sampleList[0] ?? []

            return (
              <div key={name} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '6px 0',
                borderBottom: ci < classNames.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'
              }}>
                <div style={{
                  width: 70, fontSize: 11, fontFamily: 'JetBrains Mono',
                  color: COLORS.ecgClasses[ci] ?? '#00d4ff'
                }}>{name}</div>
                <div style={{ flex: 1 }}>
                  {sample.length > 0 ? (
                    <ECGMiniChart
                      data={isECG ? sample : (Array.isArray(sample[0]) ? (sample as unknown as number[][])[0] : sample)}
                      color={COLORS.ecgClasses[ci] ?? '#00d4ff'}
                      width={200}
                      height={40}
                    />
                  ) : (
                    <div style={{
                      height: 40, background: 'var(--bg-secondary)', borderRadius: 4,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <div className="shimmer" style={{ width: '80%', height: 20, borderRadius: 3 }} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Class distribution */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 12, padding: '16px'
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14, fontFamily: 'Rajdhani', fontWeight: 600 }}>
            CLASS DISTRIBUTION
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              >
                {distributionData.map((_, i) => (
                  <Cell key={i} fill={COLORS.ecgClasses[i] ?? '#00d4ff'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Federated Partition */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 12, padding: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Rajdhani', fontWeight: 600 }}>
            FEDERATED DATA PARTITION — {iid ? 'IID' : 'NON-IID'} SPLIT ACROSS {nClients} CLIENTS
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 8 }}>Clients:</span>
              <input type="range" min={2} max={10} value={nClients} onChange={e => setNClients(+e.target.value)}
                style={{ accentColor: '#00d4ff', width: 80 }} />
              <span style={{ fontSize: 11, color: '#00d4ff', marginLeft: 6, fontFamily: 'JetBrains Mono' }}>{nClients}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ v: true, l: 'IID' }, { v: false, l: 'Non-IID' }].map(({ v, l }) => (
                <label key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12 }}>
                  <input type="radio" checked={iid === v} onChange={() => setIid(v)} style={{ accentColor: '#00d4ff' }} />
                  <span style={{ color: iid === v ? '#00d4ff' : 'var(--text-secondary)' }}>{l}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: '8px 14px', background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: '#00ff88' }}>🔒 Privacy Guarantee: No raw data leaves each client. Only model weights are shared with the server.</span>
        </div>

        {partitionBarData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={partitionBarData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="client" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {classNames.slice(0, 6).map((name, i) => (
                <Bar key={name} dataKey={name} stackId="a" fill={COLORS.ecgClasses[i] ?? '#00d4ff'} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading partition data...</span>
          </div>
        )}
      </div>
    </div>
  )
}
