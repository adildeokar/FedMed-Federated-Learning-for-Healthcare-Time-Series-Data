import React from 'react'
import { TrainingConfig } from '../components/training/TrainingConfig'
import { TrainingCurve } from '../components/charts/TrainingCurve'
import { ConfusionMatrix } from '../components/charts/ConfusionMatrix'
import { MetricsPanel } from '../components/training/MetricsPanel'
import { TrainingLog } from '../components/training/TrainingProgress'
import { useTraining } from '../hooks/useTraining'
import { Download } from 'lucide-react'
import type { TrainingConfig as TConfig } from '../types/training'

const ECG_CLASS_NAMES = ['Normal', 'Supraventricular', 'Ventricular', 'Fusion', 'Unknown']
const HAR_CLASS_NAMES = ['Walking', 'Walk Up', 'Walk Down', 'Sitting', 'Standing', 'Laying']

export function CentralizedTraining() {
  const {
    isTraining, startTraining, stopTraining,
    currentEpoch, currentAccuracy, currentF1, currentLoss,
    epochHistory, config, centralizedResults, progress
  } = useTraining()

  const handleStart = (cfg: TConfig) => startTraining({ ...cfg, type: 'centralized' })

  const confMatrix = centralizedResults?.confusion_matrix ?? []
  const classNames = config?.dataset === 'har' ? HAR_CLASS_NAMES : ECG_CLASS_NAMES

  const exportResults = () => {
    if (!centralizedResults) return
    const blob = new Blob([JSON.stringify({ centralizedResults, epochHistory, config }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `fedmed-central-${Date.now()}.json`; a.click()
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ marginBottom: 6 }}>
            <span style={{
              fontSize: 9, fontFamily: 'JetBrains Mono',
              background: 'rgba(59,130,246,0.15)', color: '#3b82f6',
              border: '1px solid rgba(59,130,246,0.3)', padding: '2px 7px', borderRadius: 4
            }}>CENTRALIZED TRAINING — BASELINE</span>
          </div>
          <h1 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 24, color: '#3b82f6' }}>
            Standard Training — Full Dataset Access
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Complete dataset available to a single model. Highest accuracy, zero privacy.
          </p>
        </div>
        {centralizedResults && (
          <button onClick={exportResults} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.2)', borderRadius: 6,
            color: '#3b82f6', fontSize: 11, cursor: 'pointer'
          }}>
            <Download size={12} /> Export
          </button>
        )}
      </div>

      {/* Privacy indicator */}
      <div style={{
        display: 'flex', gap: 12,
        padding: '10px 16px',
        background: 'rgba(255,71,87,0.08)',
        border: '1px solid rgba(255,71,87,0.2)',
        borderRadius: 8
      }}>
        <span style={{ fontSize: 12, color: '#ff4757' }}>⚠ Privacy Score: 0/100 — All data is centralized</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>|</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No data privacy, maximum model accuracy</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 220px', gap: 16, alignItems: 'start' }}>
        {/* Config */}
        <TrainingConfig mode="centralized" isTraining={isTraining} onStart={handleStart} onStop={stopTraining} />

        {/* Training curves */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, padding: '16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, fontFamily: 'Rajdhani', fontWeight: 600 }}>
              TRAINING & VALIDATION CURVES
            </div>
            <TrainingCurve epochHistory={epochHistory} mode="both" height={200} />
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, padding: '16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, fontFamily: 'Rajdhani', fontWeight: 600 }}>
              ACCURACY CURVE
            </div>
            <TrainingCurve epochHistory={epochHistory} mode="accuracy" height={160} />
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, padding: '16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, fontFamily: 'Rajdhani', fontWeight: 600 }}>
              TRAINING LOG
            </div>
            <TrainingLog />
          </div>
        </div>

        {/* Right: Metrics + Confusion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <MetricsPanel
            accuracy={currentAccuracy}
            f1={currentF1}
            loss={currentLoss}
            epoch={currentEpoch}
            totalEpochs={config?.epochs ?? 15}
            mode="centralized"
          />

          {/* Model architecture */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 12, padding: '12px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, fontFamily: 'Rajdhani', fontWeight: 600 }}>
              MODEL ARCHITECTURE
            </div>
            {(config?.model === 'lstm' ? [
              'BiLSTM(1, 64)', 'Attention', 'FC(128, 64)', 'FC(64, 5)', 'Softmax'
            ] : [
              'Conv1D(1→32)', 'BN+ReLU+Pool', 'Conv1D(32→64)', 'BN+ReLU+Pool',
              'Conv1D(64→128)', 'GlobalAvgPool', 'FC(256→128)', 'FC(128→5)', 'Softmax'
            ]).map((layer, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{
                  width: 16, height: 16, borderRadius: 4, fontSize: 9,
                  background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#3b82f6', fontFamily: 'JetBrains Mono'
                }}>{i + 1}</div>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}>{layer}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confusion Matrix */}
      {confMatrix.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, padding: '16px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, fontFamily: 'Rajdhani', fontWeight: 600 }}>
            CONFUSION MATRIX — TEST SET
          </div>
          <ConfusionMatrix matrix={confMatrix} classNames={classNames} />
        </div>
      )}
    </div>
  )
}
