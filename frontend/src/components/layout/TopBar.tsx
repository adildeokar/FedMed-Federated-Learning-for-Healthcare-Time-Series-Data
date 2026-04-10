import React from 'react'
import { useLocation } from 'react-router-dom'
import { Activity, Wifi, WifiOff } from 'lucide-react'
import { useTrainingStore } from '../../store/trainingStore'

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'FedMed Research Platform' },
  '/data': { title: 'Data Explorer', subtitle: 'ECG & HAR Dataset Visualization' },
  '/federated': { title: 'Federated Training', subtitle: 'Mini Project 3 + Major Project 2' },
  '/centralized': { title: 'Centralized Training', subtitle: 'Baseline Comparison' },
  '/distributed': { title: 'Distributed Training', subtitle: 'Data-Parallel Simulation' },
  '/comparison': { title: 'Performance Comparison', subtitle: 'Centralized vs Distributed vs Federated' },
  '/about': { title: 'About FedMed', subtitle: 'Project Overview & Architecture' },
}

export function TopBar() {
  const location = useLocation()
  const { wsConnected, isTraining, statusMessage, currentAccuracy } = useTrainingStore()
  const page = pageTitles[location.pathname] ?? { title: 'FedMed', subtitle: '' }

  return (
    <header style={{
      height: 56,
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 16,
      zIndex: 5
    }}>
      <div style={{ flex: 1 }}>
        <h1 style={{
          fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 18,
          color: 'var(--text-primary)', lineHeight: 1
        }}>{page.title}</h1>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{page.subtitle}</p>
      </div>

      {isTraining && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255, 184, 0, 0.1)',
          border: '1px solid rgba(255, 184, 0, 0.3)',
          borderRadius: 6, padding: '4px 10px'
        }}>
          <Activity size={12} color="#ffb800" style={{ animation: 'pulse 1s infinite' }} />
          <span style={{ fontSize: 11, color: '#ffb800', fontFamily: 'JetBrains Mono' }}>
            {statusMessage}
          </span>
          {currentAccuracy > 0 && (
            <span style={{ fontSize: 11, color: '#00d4ff', fontFamily: 'JetBrains Mono', marginLeft: 4 }}>
              | {(currentAccuracy * 100).toFixed(1)}%
            </span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {wsConnected
          ? <Wifi size={14} color="#00ff88" />
          : <WifiOff size={14} color="#ff4757" />
        }
        <span style={{
          fontSize: 11, fontFamily: 'JetBrains Mono',
          color: wsConnected ? '#00ff88' : '#ff4757'
        }}>
          {wsConnected ? 'Live' : 'Offline'}
        </span>
      </div>
    </header>
  )
}
