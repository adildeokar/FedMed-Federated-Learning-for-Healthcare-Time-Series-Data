import React from 'react'
import { motion } from 'framer-motion'

interface ConfusionMatrixProps {
  matrix: number[][]
  classNames?: string[]
  height?: number
}

function heatColor(value: number, max: number): string {
  const t = max > 0 ? value / max : 0
  if (t === 0) return 'rgba(13, 20, 36, 0.8)'
  const alpha = 0.15 + t * 0.85
  if (t > 0.5) {
    return `rgba(0, 212, 255, ${alpha})`
  }
  return `rgba(0, 100, 160, ${alpha})`
}

export function ConfusionMatrix({ matrix, classNames, height = 280 }: ConfusionMatrixProps) {
  if (!matrix || matrix.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>No confusion matrix data</span>
      </div>
    )
  }

  const n = matrix.length
  const names = classNames ?? Array.from({ length: n }, (_, i) => `C${i}`)
  const maxVal = Math.max(...matrix.flat())
  const cellSize = Math.min(Math.floor((height - 40) / n), 52)

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'inline-block', paddingLeft: 60, paddingTop: 20 }}>
        {/* Column headers */}
        <div style={{ display: 'flex', marginBottom: 4, paddingLeft: cellSize }}>
          {names.map(name => (
            <div key={name} style={{
              width: cellSize, textAlign: 'center',
              fontSize: 10, color: 'var(--text-muted)',
              fontFamily: 'JetBrains Mono', transform: 'rotate(-30deg)',
              transformOrigin: 'bottom center', height: 30, lineHeight: '30px'
            }}>
              {name}
            </div>
          ))}
        </div>

        {matrix.map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            {/* Row label */}
            <div style={{
              width: cellSize, textAlign: 'right', paddingRight: 6,
              fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono'
            }}>
              {names[i]}
            </div>
            {row.map((val, j) => {
              const isCorrect = i === j
              const total = row.reduce((a, b) => a + b, 0)
              const pct = total > 0 ? ((val / total) * 100).toFixed(0) : '0'
              return (
                <motion.div
                  key={j}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (i * n + j) * 0.02, duration: 0.3 }}
                  title={`Actual: ${names[i]}, Predicted: ${names[j]}: ${val} (${pct}%)`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    background: heatColor(val, maxVal),
                    border: isCorrect
                      ? '1px solid rgba(0, 212, 255, 0.5)'
                      : '1px solid rgba(255, 255, 255, 0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'default',
                    transition: 'all 0.2s',
                    margin: 1
                  }}
                >
                  <span style={{
                    fontSize: cellSize > 40 ? 12 : 10,
                    fontFamily: 'JetBrains Mono',
                    color: val > maxVal * 0.5 ? '#fff' : 'var(--text-secondary)',
                    fontWeight: isCorrect ? 700 : 400
                  }}>{val}</span>
                  {cellSize > 35 && (
                    <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{pct}%</span>
                  )}
                </motion.div>
              )
            })}
          </div>
        ))}

        {/* Axis labels */}
        <div style={{ textAlign: 'center', marginTop: 8, paddingLeft: cellSize }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Predicted</span>
        </div>
      </div>
      <div style={{
        position: 'absolute', left: -50, top: '50%', transform: 'rotate(-90deg)',
        fontSize: 10, color: 'var(--text-muted)'
      }}>Actual</div>
    </div>
  )
}
