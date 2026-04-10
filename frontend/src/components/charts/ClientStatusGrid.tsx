import React from 'react'
import { motion } from 'framer-motion'
import type { ClientState } from '../../types/training'
import { getClientColor } from '../../utils/colors'

const STATE_COLORS: Record<ClientState, string> = {
  idle: '#374151',
  training: '#f59e0b',
  sending: '#00d4ff',
  done: '#00ff88'
}

const STATE_LABELS: Record<ClientState, string> = {
  idle: 'Idle',
  training: 'Training...',
  sending: 'Sending',
  done: 'Done'
}

interface ClientStatusGridProps {
  nClients?: number
  clientStates?: Record<number, ClientState>
  clientMetrics?: Array<{ client_id: number; n_samples: number; loss: number }>
}

export function ClientStatusGrid({ nClients = 5, clientStates = {}, clientMetrics = [] }: ClientStatusGridProps) {
  const metricsMap = Object.fromEntries(clientMetrics.map(m => [m.client_id, m]))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
      {Array.from({ length: nClients }, (_, i) => {
        const state = clientStates[i] ?? 'idle'
        const color = STATE_COLORS[state]
        const metrics = metricsMap[i]
        const clientColor = getClientColor(i)
        const isActive = state === 'training' || state === 'sending'

        return (
          <motion.div
            key={i}
            animate={isActive ? { borderColor: [color, `${color}44`, color] } : {}}
            transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
            style={{
              background: 'var(--bg-card)',
              border: `1px solid ${color}44`,
              borderRadius: 8,
              padding: '10px 12px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Status indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: color,
                boxShadow: `0 0 6px ${color}`,
                animation: isActive ? 'pulse 1s infinite' : 'none'
              }} />
              <span style={{
                fontSize: 12, fontWeight: 600, fontFamily: 'JetBrains Mono',
                color: clientColor
              }}>Client {i}</span>
            </div>

            <div style={{ fontSize: 10, color: color, fontFamily: 'JetBrains Mono', marginBottom: 4 }}>
              {STATE_LABELS[state]}
            </div>

            {metrics && (
              <>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                  {metrics.n_samples} samples
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}>
                  loss: {metrics.loss.toFixed(4)}
                </div>
              </>
            )}

            {!metrics && (
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                Waiting...
              </div>
            )}

            {/* Accent bar */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0,
              height: 2, width: '100%',
              background: `linear-gradient(90deg, ${color}, transparent)`,
              opacity: 0.5
            }} />
          </motion.div>
        )
      })}
    </div>
  )
}
