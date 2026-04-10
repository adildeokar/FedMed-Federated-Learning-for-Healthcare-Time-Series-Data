import React, { useState } from 'react'
import { Play, Square, Zap } from 'lucide-react'
import { GlowButton } from '../ui/GlowButton'
import type { TrainingConfig as TConfig, TrainingType } from '../../types/training'

interface TrainingConfigProps {
  onStart: (config: TConfig) => void
  onStop: () => void
  isTraining: boolean
  mode: 'federated' | 'centralized' | 'distributed'
  defaultConfig?: Partial<TConfig>
}

const PRESETS = [
  { label: 'Quick', n_clients: 3, n_rounds: 5, local_epochs: 2, epochs: 8 },
  { label: 'Standard', n_clients: 5, n_rounds: 10, local_epochs: 3, epochs: 15 },
  { label: 'Full', n_clients: 10, n_rounds: 20, local_epochs: 5, epochs: 20 },
]

export function TrainingConfig({ onStart, onStop, isTraining, mode, defaultConfig = {} }: TrainingConfigProps) {
  const [config, setConfig] = useState<Partial<TConfig>>({
    type: mode as TrainingType,
    dataset: 'ecg',
    model: 'cnn',
    epochs: 15,
    lr: 0.001,
    batch_size: 64,
    n_clients: 5,
    n_rounds: 10,
    local_epochs: 3,
    n_workers: 3,
    iid: true,
    ...defaultConfig
  })

  const update = (k: string, v: unknown) => setConfig(prev => ({ ...prev, [k]: v }))

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setConfig(prev => ({
      ...prev,
      n_clients: preset.n_clients,
      n_rounds: preset.n_rounds,
      local_epochs: preset.local_epochs,
      epochs: preset.epochs
    }))
  }

  const handleStart = () => onStart(config as TConfig)

  const labelStyle: React.CSSProperties = { fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }
  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
    borderRadius: 6, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 13,
    fontFamily: 'DM Sans', outline: 'none'
  }
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 12,
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }}>
      <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 14, color: 'var(--accent-primary)', letterSpacing: '0.05em' }}>
        TRAINING CONFIGURATION
      </div>

      {/* Presets */}
      <div>
        <div style={labelStyle}>Quick Presets</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              disabled={isTraining}
              style={{
                flex: 1, padding: '5px 0', fontSize: 11, fontFamily: 'JetBrains Mono',
                background: 'rgba(0, 212, 255, 0.06)',
                border: '1px solid rgba(0, 212, 255, 0.2)',
                borderRadius: 5, color: '#00d4ff', cursor: isTraining ? 'not-allowed' : 'pointer'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dataset */}
      <div>
        <div style={labelStyle}>Dataset</div>
        <select value={config.dataset} onChange={e => update('dataset', e.target.value)} disabled={isTraining} style={selectStyle}>
          <option value="ecg">ECG — MIT-BIH Arrhythmia</option>
          <option value="har">HAR — Wearable Sensors</option>
        </select>
      </div>

      {/* Model */}
      <div>
        <div style={labelStyle}>Model Architecture</div>
        <select value={config.model} onChange={e => update('model', e.target.value)} disabled={isTraining} style={selectStyle}>
          <option value="cnn">1D CNN (Recommended)</option>
          <option value="lstm">BiLSTM + Attention</option>
        </select>
      </div>

      {mode === 'federated' && (
        <>
          <div>
            <div style={labelStyle}>Clients: {config.n_clients}</div>
            <input type="range" min={2} max={10} value={config.n_clients} disabled={isTraining}
              onChange={e => update('n_clients', +e.target.value)}
              style={{ width: '100%', accentColor: '#00d4ff' }} />
          </div>
          <div>
            <div style={labelStyle}>Rounds: {config.n_rounds}</div>
            <input type="range" min={3} max={20} value={config.n_rounds} disabled={isTraining}
              onChange={e => update('n_rounds', +e.target.value)}
              style={{ width: '100%', accentColor: '#00d4ff' }} />
          </div>
          <div>
            <div style={labelStyle}>Local Epochs: {config.local_epochs}</div>
            <input type="range" min={1} max={10} value={config.local_epochs} disabled={isTraining}
              onChange={e => update('local_epochs', +e.target.value)}
              style={{ width: '100%', accentColor: '#00d4ff' }} />
          </div>
          <div>
            <div style={labelStyle}>Data Distribution</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ v: true, l: 'IID' }, { v: false, l: 'Non-IID' }].map(({ v, l }) => (
                <label key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12 }}>
                  <input type="radio" checked={config.iid === v} onChange={() => update('iid', v)} disabled={isTraining}
                    style={{ accentColor: '#00d4ff' }} />
                  <span style={{ color: config.iid === v ? '#00d4ff' : 'var(--text-secondary)' }}>{l}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {mode === 'centralized' && (
        <div>
          <div style={labelStyle}>Epochs: {config.epochs}</div>
          <input type="range" min={5} max={30} value={config.epochs} disabled={isTraining}
            onChange={e => update('epochs', +e.target.value)}
            style={{ width: '100%', accentColor: '#00d4ff' }} />
        </div>
      )}

      {mode === 'distributed' && (
        <>
          <div>
            <div style={labelStyle}>Workers: {config.n_workers}</div>
            <input type="range" min={2} max={4} value={config.n_workers} disabled={isTraining}
              onChange={e => update('n_workers', +e.target.value)}
              style={{ width: '100%', accentColor: '#8b5cf6' }} />
          </div>
          <div>
            <div style={labelStyle}>Epochs: {config.epochs}</div>
            <input type="range" min={5} max={30} value={config.epochs} disabled={isTraining}
              onChange={e => update('epochs', +e.target.value)}
              style={{ width: '100%', accentColor: '#8b5cf6' }} />
          </div>
        </>
      )}

      {/* LR */}
      <div>
        <div style={labelStyle}>Learning Rate</div>
        <select value={config.lr} onChange={e => update('lr', +e.target.value)} disabled={isTraining} style={selectStyle}>
          <option value={0.001}>0.001 (Default)</option>
          <option value={0.0001}>0.0001</option>
          <option value={0.01}>0.01</option>
        </select>
      </div>

      {/* Privacy indicators (federated only) */}
      {mode === 'federated' && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
          <div style={labelStyle}>Privacy Features</div>
          {['No raw data sharing', 'FedAvg aggregation', 'Local training only', 'Gradient privacy'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#00ff88', marginBottom: 3 }}>
              <span>✓</span> {f}
            </div>
          ))}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        {!isTraining ? (
          <GlowButton variant="green" onClick={handleStart} fullWidth>
            <Play size={14} /> Start Training
          </GlowButton>
        ) : (
          <GlowButton variant="danger" onClick={onStop} fullWidth>
            <Square size={14} /> Stop
          </GlowButton>
        )}
      </div>
    </div>
  )
}
