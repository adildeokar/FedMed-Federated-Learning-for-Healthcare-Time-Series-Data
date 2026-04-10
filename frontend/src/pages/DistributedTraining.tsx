import React from 'react'
import { TrainingConfig } from '../components/training/TrainingConfig'
import { TrainingCurve } from '../components/charts/TrainingCurve'
import { ConfusionMatrix } from '../components/charts/ConfusionMatrix'
import { MetricsPanel } from '../components/training/MetricsPanel'
import { TrainingLog } from '../components/training/TrainingProgress'
import { useTraining } from '../hooks/useTraining'
import { useTrainingStore } from '../store/trainingStore'
import type { TrainingConfig as TConfig } from '../types/training'
import { getClientColor } from '../utils/colors'

const ECG_CLASS_NAMES = ['Normal', 'Supraventricular', 'Ventricular', 'Fusion', 'Unknown']
const HAR_CLASS_NAMES = ['Walking', 'Walk Up', 'Walk Down', 'Sitting', 'Standing', 'Laying']

export function DistributedTraining() {
  const {
    isTraining, startTraining, stopTraining,
    currentEpoch, currentAccuracy, currentF1, currentLoss,
    epochHistory, config, distributedResults
  } = useTraining()

  const { trainingLogs } = useTrainingStore()

  const handleStart = (cfg: TConfig) => startTraining({ ...cfg, type: 'distributed' })

  const confMatrix = distributedResults?.confusion_matrix ?? []
  const classNames = config?.dataset === 'har' ? HAR_CLASS_NAMES : ECG_CLASS_NAMES
  const nWorkers = config?.n_workers ?? 3
  const speedup = distributedResults?.speedup_factor ?? (nWorkers * 0.7)

  const workerLogs = epochHistory.map(e => ({
    epoch: e.epoch,
    workers: Array.from({ length: nWorkers }, (_, i) => ({
      id: i,
      loss: e.train_loss + (Math.random() - 0.5) * 0.05
    }))
  }))

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ marginBottom: 6 }}>
            <span style={{
              fontSize: 9, fontFamily: 'JetBrains Mono',
              background: 'rgba(139,92,246,0.15)', color: '#8b5cf6',
              border: '1px solid rgba(139,92,246,0.3)', padding: '2px 7px', borderRadius: 4
            }}>DATA PARALLEL — SIMULATED</span>
          </div>
          <h1 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 24, color: '#8b5cf6' }}>
            Distributed Training — AllReduce Simulation
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Data is split across {nWorkers} workers. Gradients are synchronized via simulated AllReduce.
          </p>
        </div>
      </div>

      {/* Privacy + Speedup indicators */}
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          padding: '8px 14px', background: 'rgba(255,184,0,0.08)',
          border: '1px solid rgba(255,184,0,0.2)', borderRadius: 8
        }}>
          <span style={{ fontSize: 12, color: '#ffb800' }}>⚠ Privacy Score: 20/100 — Data shared across workers</span>
        </div>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          padding: '8px 14px', background: 'rgba(139,92,246,0.08)',
          border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8
        }}>
          <span style={{ fontSize: 12, color: '#8b5cf6' }}>⚡ Simulated Speedup: {speedup.toFixed(1)}× vs. Centralized</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 220px', gap: 16, alignItems: 'start' }}>
        <TrainingConfig mode="distributed" isTraining={isTraining} onStart={handleStart} onStop={stopTraining} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Worker visualization */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12, padding: '16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, fontFamily: 'Rajdhani', fontWeight: 600 }}>
              WORKER STATUS — DATA PARALLEL SIMULATION
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${nWorkers}, 1fr)`, gap: 12 }}>
              {Array.from({ length: nWorkers }, (_, i) => {
                const color = getClientColor(i)
                const lastLog = trainingLogs.filter(l => l.message.includes(`Worker ${i}`)).slice(-1)[0]
                return (
                  <div key={i} style={{
                    background: 'var(--bg-secondary)',
                    border: `1px solid ${color}33`,
                    borderRadius: 8, padding: '12px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: `${color}22`, border: `2px solid ${color}66`,
                      margin: '0 auto 8px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontFamily: 'JetBrains Mono', color
                    }}>W{i}</div>
                    <div style={{ fontSize: 11, color, fontFamily: 'JetBrains Mono', marginBottom: 4 }}>Worker {i}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {isTraining ? 'Computing...' : 'Idle'}
                    </div>
                    {lastLog && (
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'JetBrains Mono' }}>
                        {lastLog.message.split('loss: ')[1] ?? ''}
                      </div>
                    )}
                    {/* GPU bar */}
                    <div style={{ marginTop: 8, height: 4, background: 'var(--bg-card)', borderRadius: 2 }}>
                      <div style={{
                        height: '100%',
                        width: isTraining ? `${50 + Math.random() * 40}%` : '5%',
                        background: color, borderRadius: 2, transition: 'width 0.5s'
                      }} />
                    </div>
                    <div style={{ fontSize: 8, color: 'var(--text-muted)', marginTop: 2 }}>GPU Util.</div>
                  </div>
                )
              })}
            </div>

            {/* AllReduce visualization */}
            <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: '#8b5cf6', fontFamily: 'JetBrains Mono', marginBottom: 4 }}>
                GRADIENT SYNCHRONIZATION — AllReduce
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                Each epoch: workers compute gradients independently → AllReduce averages them → global model updated
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12, padding: '16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, fontFamily: 'Rajdhani', fontWeight: 600 }}>
              TRAINING CURVES
            </div>
            <TrainingCurve epochHistory={epochHistory} mode="both" height={200} />
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12, padding: '12px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'Rajdhani', fontWeight: 600 }}>
              TRAINING LOG
            </div>
            <TrainingLog />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <MetricsPanel
            accuracy={currentAccuracy}
            f1={currentF1}
            loss={currentLoss}
            epoch={currentEpoch}
            totalEpochs={config?.epochs ?? 15}
            mode="distributed"
          />

          {distributedResults && (
            <div style={{
              background: 'var(--bg-card)', border: '1px solid rgba(139,92,246,0.2)',
              borderRadius: 12, padding: '12px 16px'
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'Rajdhani', fontWeight: 600 }}>
                DISTRIBUTED STATS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  ['Workers', String(distributedResults.n_workers ?? nWorkers)],
                  ['Speedup', `${(distributedResults.speedup_factor ?? speedup).toFixed(2)}×`],
                  ['Test Acc', `${((distributedResults.test_accuracy ?? 0) * 100).toFixed(1)}%`],
                  ['Test F1', (distributedResults.test_f1 ?? 0).toFixed(4)],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                    <span style={{ color: '#8b5cf6', fontFamily: 'JetBrains Mono' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {confMatrix.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12, padding: '16px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, fontFamily: 'Rajdhani', fontWeight: 600 }}>
            CONFUSION MATRIX — TEST SET
          </div>
          <ConfusionMatrix matrix={confMatrix} classNames={classNames} />
        </div>
      )}
    </div>
  )
}
