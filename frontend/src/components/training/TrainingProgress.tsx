import React, { useRef, useEffect } from 'react'
import { useTrainingStore } from '../../store/trainingStore'

export function TrainingLog() {
  const { trainingLogs } = useTrainingStore()
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [trainingLogs])

  return (
    <div
      ref={logRef}
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 8,
        padding: '10px 12px',
        height: 200,
        overflowY: 'auto',
        fontFamily: 'JetBrains Mono',
        fontSize: 11
      }}
    >
      {trainingLogs.length === 0 ? (
        <div style={{ color: 'var(--text-muted)' }}>Waiting for training to start...</div>
      ) : (
        trainingLogs.map((log, i) => (
          <div
            key={i}
            className={`log-entry log-${log.type}`}
            style={{ marginBottom: 2 }}
          >
            <span style={{ color: 'var(--text-muted)', marginRight: 8 }}>[{log.time}]</span>
            {log.message}
          </div>
        ))
      )}
    </div>
  )
}

export function ProgressBar({ progress, color = '#00d4ff', label }: { progress: number; color?: string; label?: string }) {
  return (
    <div>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
          <span style={{ fontSize: 11, color, fontFamily: 'JetBrains Mono' }}>{progress.toFixed(0)}%</span>
        </div>
      )}
      <div style={{ height: 6, background: 'var(--bg-card)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${Math.min(progress, 100)}%`,
          background: `linear-gradient(90deg, ${color}, ${color}88)`,
          borderRadius: 3,
          transition: 'width 0.3s ease',
          boxShadow: `0 0 8px ${color}66`
        }} />
      </div>
    </div>
  )
}
