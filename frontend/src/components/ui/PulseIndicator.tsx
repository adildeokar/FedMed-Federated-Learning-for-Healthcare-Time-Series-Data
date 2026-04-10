import React from 'react'

interface PulseIndicatorProps {
  active?: boolean
  color?: string
  size?: number
}

export function PulseIndicator({ active = true, color = '#00d4ff', size = 10 }: PulseIndicatorProps) {
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      {active && (
        <span
          className="absolute inline-flex h-full w-full rounded-full opacity-75"
          style={{
            backgroundColor: color,
            animation: 'ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite'
          }}
        />
      )}
      <span
        className="relative inline-flex rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: active ? color : '#374151'
        }}
      />
    </span>
  )
}
