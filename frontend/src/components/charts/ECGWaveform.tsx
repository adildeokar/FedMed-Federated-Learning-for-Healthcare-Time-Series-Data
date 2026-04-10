import React, { useMemo } from 'react'

interface ECGWaveformProps {
  color?: string
  height?: number
  className?: string
  animated?: boolean
  data?: number[]
}

function generateECGPath(width: number, height: number): string {
  const mid = height / 2
  const segments: string[] = []
  const cycles = 4
  const cycleWidth = width / cycles

  for (let c = 0; c < cycles * 2; c++) {
    const ox = c * cycleWidth
    // Baseline
    segments.push(`M ${ox} ${mid}`)
    // P wave
    segments.push(`Q ${ox + cycleWidth * 0.1} ${mid - height * 0.08} ${ox + cycleWidth * 0.2} ${mid}`)
    // PR segment
    segments.push(`L ${ox + cycleWidth * 0.28} ${mid}`)
    // Q dip
    segments.push(`L ${ox + cycleWidth * 0.31} ${mid + height * 0.12}`)
    // R peak
    segments.push(`L ${ox + cycleWidth * 0.35} ${mid - height * 0.38}`)
    // S dip
    segments.push(`L ${ox + cycleWidth * 0.39} ${mid + height * 0.15}`)
    // ST segment
    segments.push(`L ${ox + cycleWidth * 0.48} ${mid}`)
    // T wave
    segments.push(`Q ${ox + cycleWidth * 0.65} ${mid - height * 0.14} ${ox + cycleWidth * 0.8} ${mid}`)
    // Baseline
    segments.push(`L ${ox + cycleWidth} ${mid}`)
  }

  return segments.join(' ')
}

export function ECGWaveform({ color = '#00d4ff', height = 80, animated = true, data }: ECGWaveformProps) {
  const width = 800
  const path = useMemo(() => {
    if (data && data.length > 0) {
      const minVal = Math.min(...data)
      const maxVal = Math.max(...data)
      const range = maxVal - minVal || 1
      const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * width * 2
        const y = height / 2 - ((v - minVal) / range - 0.5) * height * 0.8
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      return points.join(' ')
    }
    return generateECGPath(width, height)
  }, [data, height, width])

  return (
    <div style={{ overflow: 'hidden', width: '100%', height }}>
      <svg
        width="200%"
        height={height}
        style={{
          display: 'block',
          animation: animated ? 'ecgScroll 6s linear infinite' : 'none'
        }}
        viewBox={`0 0 ${width * 2} ${height}`}
        preserveAspectRatio="none"
      >
        <path
          d={path}
          stroke={color}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 4px ${color}88)` }}
        />
      </svg>
    </div>
  )
}

export function ECGMiniChart({ data, color = '#00d4ff', width = 200, height = 50 }: {
  data: number[]; color?: string; width?: number; height?: number
}) {
  if (!data || data.length === 0) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height * 0.85 - height * 0.075
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline
        points={points}
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        style={{ filter: `drop-shadow(0 0 3px ${color}88)` }}
      />
    </svg>
  )
}
