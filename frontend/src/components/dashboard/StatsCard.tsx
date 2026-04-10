import React from 'react'
import { motion } from 'framer-motion'
import { AnimatedCounter } from '../ui/AnimatedCounter'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: number
  suffix?: string
  decimals?: number
  icon?: LucideIcon
  color?: string
  subtitle?: string
  change?: number
}

export function StatsCard({
  title, value, suffix = '', decimals = 1, icon: Icon, color = '#00d4ff', subtitle, change
}: StatsCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: `0 0 20px ${color}33` }}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${color}22`,
        borderRadius: 12,
        padding: '16px 20px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default'
      }}
    >
      {/* Background accent */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 80, height: 80,
        background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </div>
          <div style={{
            fontSize: 28, fontWeight: 700, fontFamily: 'JetBrains Mono',
            color: color, lineHeight: 1
          }}>
            <AnimatedCounter value={value} decimals={decimals} suffix={suffix} />
          </div>
          {subtitle && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{subtitle}</div>
          )}
          {change !== undefined && (
            <div style={{ fontSize: 11, color: change >= 0 ? '#00ff88' : '#ff4757', marginTop: 4 }}>
              {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
            </div>
          )}
        </div>
        {Icon && (
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: `${color}15`,
            border: `1px solid ${color}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Icon size={16} color={color} />
          </div>
        )}
      </div>

      {/* Bottom accent line */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0,
        height: 2, width: '100%',
        background: `linear-gradient(90deg, ${color}66, transparent)`,
      }} />
    </motion.div>
  )
}
