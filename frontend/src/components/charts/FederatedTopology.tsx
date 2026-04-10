import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ClientState } from '../../types/training'
import { getClientColor } from '../../utils/colors'

interface FederatedTopologyProps {
  nClients?: number
  clientStates?: Record<number, ClientState>
  activeClientId?: number | null
  width?: number
  height?: number
  isTraining?: boolean
}

const STATE_COLORS: Record<ClientState, string> = {
  idle: '#374151',
  training: '#f59e0b',
  sending: '#00d4ff',
  done: '#00ff88'
}

const STATE_LABELS: Record<ClientState, string> = {
  idle: 'Idle',
  training: 'Training',
  sending: 'Sending',
  done: 'Done'
}

export function FederatedTopology({
  nClients = 5,
  clientStates = {},
  activeClientId = null,
  width = 400,
  height = 320,
  isTraining = false
}: FederatedTopologyProps) {
  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(width, height) * 0.32
  const serverR = 28

  const clientPositions = useMemo(() =>
    Array.from({ length: nClients }, (_, i) => {
      const angle = (i / nClients) * Math.PI * 2 - Math.PI / 2
      return {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        id: i
      }
    }), [nClients, cx, cy, radius])

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="serverGlow">
          <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <marker id="arrowCyan" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#00d4ff" />
        </marker>
        <marker id="arrowGreen" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#00ff88" />
        </marker>
      </defs>

      {/* Server glow background */}
      {isTraining && (
        <motion.circle
          cx={cx} cy={cy} r={serverR * 2.5}
          fill="url(#serverGlow)"
          animate={{ r: [serverR * 2, serverR * 3, serverR * 2], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Connection lines */}
      {clientPositions.map(client => {
        const state = clientStates[client.id] ?? 'idle'
        const isActive = client.id === activeClientId
        const color = STATE_COLORS[state]
        const isFlowing = state === 'training' || state === 'sending' || isTraining

        return (
          <g key={`line-${client.id}`}>
            {/* Background line */}
            <line
              x1={cx} y1={cy}
              x2={client.x} y2={client.y}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
            {/* Active animated line */}
            {isFlowing && (
              <line
                x1={cx} y1={cy}
                x2={client.x} y2={client.y}
                stroke={color}
                strokeWidth={isActive ? 2 : 1}
                strokeOpacity={0.6}
                strokeDasharray="6 4"
                style={{ animation: 'dash-flow 0.8s linear infinite' }}
              />
            )}
          </g>
        )
      })}

      {/* Client nodes */}
      {clientPositions.map(client => {
        const state = clientStates[client.id] ?? 'idle'
        const color = STATE_COLORS[state]
        const isActive = client.id === activeClientId
        const clientColor = getClientColor(client.id)

        return (
          <g key={`client-${client.id}`}>
            {/* Pulse ring for active client */}
            {isActive && (
              <motion.circle
                cx={client.x} cy={client.y}
                r={20}
                fill="none"
                stroke={color}
                strokeWidth="2"
                animate={{ r: [16, 26], opacity: [0.8, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}

            {/* Node body */}
            <motion.circle
              cx={client.x}
              cy={client.y}
              r={16}
              fill={`${color}22`}
              stroke={color}
              strokeWidth={isActive ? 2.5 : 1.5}
              animate={{ scale: isActive ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.8, repeat: isActive ? Infinity : 0 }}
              filter={isActive ? 'url(#glow)' : undefined}
            />

            {/* Client label */}
            <text
              x={client.x}
              y={client.y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={color}
              fontSize={10}
              fontFamily="JetBrains Mono"
              fontWeight="700"
            >
              C{client.id}
            </text>

            {/* State label below */}
            <text
              x={client.x}
              y={client.y + 26}
              textAnchor="middle"
              fill={color}
              fontSize={8}
              fontFamily="JetBrains Mono"
              opacity={0.8}
            >
              {STATE_LABELS[state]}
            </text>
          </g>
        )
      })}

      {/* Server node */}
      <motion.circle
        cx={cx} cy={cy}
        r={serverR}
        fill="rgba(0, 212, 255, 0.12)"
        stroke="#00d4ff"
        strokeWidth="2"
        animate={isTraining ? {
          strokeOpacity: [1, 0.4, 1],
          r: [serverR, serverR + 2, serverR]
        } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
        filter="url(#glow)"
      />
      <text
        x={cx} y={cy - 4}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#00d4ff"
        fontSize={9}
        fontFamily="JetBrains Mono"
        fontWeight="700"
      >SERVER</text>
      <text
        x={cx} y={cy + 8}
        textAnchor="middle"
        fill="#00d4ff"
        fontSize={8}
        fontFamily="JetBrains Mono"
        opacity={0.7}
      >FedAvg</text>
    </svg>
  )
}
