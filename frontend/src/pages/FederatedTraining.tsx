import React, { useState } from 'react'
import { TrainingConfig } from '../components/training/TrainingConfig'
import { FederatedTopology } from '../components/charts/FederatedTopology'
import { TrainingCurve } from '../components/charts/TrainingCurve'
import { ConfusionMatrix } from '../components/charts/ConfusionMatrix'
import { ClientStatusGrid } from '../components/charts/ClientStatusGrid'
import { MetricsPanel } from '../components/training/MetricsPanel'
import { TrainingLog } from '../components/training/TrainingProgress'
import { useTraining } from '../hooks/useTraining'
import { Download, Shield, Clock, Wifi } from 'lucide-react'
import type { TrainingConfig as TConfig } from '../types/training'

const ECG_CLASS_NAMES = ['Normal', 'Supraventricular', 'Ventricular', 'Fusion', 'Unknown']
const HAR_CLASS_NAMES = ['Walking', 'Walk Up', 'Walk Down', 'Sitting', 'Standing', 'Laying']

export function FederatedTraining() {
  const {
    isTraining, startTraining, stopTraining,
    currentRound, currentAccuracy, currentF1, currentLoss,
    roundHistory, clientStates, activeClientId, config,
    federatedResults, progress
  } = useTraining()

  const [activeTab, setActiveTab] = useState<'matrix' | 'convergence'>('convergence')

  const nClients = config?.n_clients ?? 5
  const nRounds = config?.n_rounds ?? 10
  const latestRound = roundHistory[roundHistory.length - 1]
  const latestMatrix = latestRound?.confusion_matrix ?? federatedResults?.confusion_matrix ?? []

  const classNames = config?.dataset === 'har' ? HAR_CLASS_NAMES : ECG_CLASS_NAMES

  const totalCommCost = roundHistory.reduce((s, r) => s + (r.communication_cost_kb ?? 0), 0)

  const handleStart = (cfg: TConfig) => {
    startTraining({ ...cfg, type: 'federated' })
  }

  const exportResults = () => {
    if (!federatedResults) return
    const blob = new Blob([JSON.stringify({ federatedResults, roundHistory, config }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fedmed-fl-results-${Date.now()}.json`
    a.click()
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <span style={{
              fontSize: 9, fontFamily: 'JetBrains Mono',
              background: 'rgba(0,212,255,0.15)', color: '#00d4ff',
              border: '1px solid rgba(0,212,255,0.3)', padding: '2px 7px', borderRadius: 4
            }}>MINI PROJECT 3</span>
            <span style={{
              fontSize: 9, fontFamily: 'JetBrains Mono',
              background: 'rgba(0,255,136,0.1)', color: '#00ff88',
              border: '1px solid rgba(0,255,136,0.3)', padding: '2px 7px', borderRadius: 4
            }}>MAJOR PROJECT 2</span>
          </div>
          <h1 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 24, color: '#00d4ff' }}>
            Federated Learning — ECG/Wearable Classification
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 6 }}>
            <Shield size={12} color="#00ff88" />
            <span style={{ fontSize: 11, color: '#00ff88', fontFamily: 'JetBrains Mono' }}>Privacy Score: 95/100</span>
          </div>
          {federatedResults && (
            <button onClick={exportResults} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', background: 'rgba(0,212,255,0.08)',
              border: '1px solid rgba(0,212,255,0.2)', borderRadius: 6,
              color: '#00d4ff', fontSize: 11, cursor: 'pointer'
            }}>
              <Download size={12} /> Export Results
            </button>
          )}
        </div>
      </div>

      {/* Main 3-panel layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 240px', gap: 16, alignItems: 'start' }}>
        {/* Left: Config */}
        <TrainingConfig
          mode="federated"
          isTraining={isTraining}
          onStart={handleStart}
          onStop={stopTraining}
        />

        {/* Center: Topology + Log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Topology */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center'
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, fontFamily: 'Rajdhani', fontWeight: 600, alignSelf: 'flex-start' }}>
              FEDERATED TOPOLOGY — FEDAVG
            </div>
            <FederatedTopology
              nClients={nClients}
              clientStates={clientStates}
              activeClientId={activeClientId}
              isTraining={isTraining}
              width={420}
              height={300}
            />
            {isTraining && (
              <div style={{ marginTop: 8, fontSize: 11, color: '#ffb800', fontFamily: 'JetBrains Mono' }}>
                Round {currentRound}/{nRounds} — {nClients} clients training locally
              </div>
            )}
          </div>

          {/* Log */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '12px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'Rajdhani', fontWeight: 600 }}>
              TRAINING LOG
            </div>
            <TrainingLog />
          </div>

          {/* Client Grid */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '12px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, fontFamily: 'Rajdhani', fontWeight: 600 }}>
              CLIENT STATUS — {nClients} WEARABLE DEVICES
            </div>
            <ClientStatusGrid
              nClients={nClients}
              clientStates={clientStates}
              clientMetrics={latestRound?.client_metrics ?? []}
            />
          </div>
        </div>

        {/* Right: Metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <MetricsPanel
            accuracy={currentAccuracy}
            f1={currentF1}
            loss={currentLoss}
            round={currentRound}
            totalRounds={nRounds}
            commCostKb={totalCommCost}
            mode="federated"
          />

          {/* Communication Timeline */}
          {roundHistory.length > 0 && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, fontFamily: 'Rajdhani', fontWeight: 600 }}>
                ROUND TIMELINE
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {roundHistory.map(r => (
                  <div key={r.round} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: r.round === currentRound && isTraining
                        ? 'rgba(255,184,0,0.2)' : 'rgba(0,212,255,0.1)',
                      border: `1px solid ${r.round === currentRound && isTraining ? '#ffb800' : '#00d4ff'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 8, color: r.round === currentRound && isTraining ? '#ffb800' : '#00d4ff',
                      fontFamily: 'JetBrains Mono', flexShrink: 0
                    }}>{r.round}</div>
                    <div style={{ flex: 1, height: 4, background: 'var(--bg-secondary)', borderRadius: 2 }}>
                      <div style={{
                        height: '100%', width: `${r.accuracy * 100}%`,
                        background: 'linear-gradient(90deg, #00d4ff, #00ff88)',
                        borderRadius: 2
                      }} />
                    </div>
                    <span style={{ fontSize: 9, color: '#00d4ff', fontFamily: 'JetBrains Mono', minWidth: 35 }}>
                      {(r.accuracy * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Training curve */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '16px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, fontFamily: 'Rajdhani', fontWeight: 600 }}>
            CONVERGENCE — ACCURACY & LOSS PER ROUND
          </div>
          <TrainingCurve roundHistory={roundHistory} showRounds height={200} />
        </div>

        {/* Confusion matrix */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '16px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {['convergence', 'matrix'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as 'matrix' | 'convergence')} style={{
                padding: '4px 12px', fontSize: 10, fontFamily: 'JetBrains Mono',
                background: activeTab === tab ? 'rgba(0,212,255,0.15)' : 'transparent',
                border: `1px solid ${activeTab === tab ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: activeTab === tab ? '#00d4ff' : 'var(--text-muted)',
                borderRadius: 5, cursor: 'pointer'
              }}>{tab.toUpperCase()}</button>
            ))}
          </div>
          {activeTab === 'matrix' ? (
            <ConfusionMatrix matrix={latestMatrix} classNames={classNames} height={220} />
          ) : (
            <TrainingCurve roundHistory={roundHistory} showRounds height={220} />
          )}
        </div>
      </div>
    </div>
  )
}
