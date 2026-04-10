import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { GlowButton } from '../ui/GlowButton'
import { ArrowRight } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface ModelCardProps {
  title: string
  badge?: string
  badgeColor?: string
  description: string
  icon: LucideIcon
  features: string[]
  route: string
  color?: string
  status?: string
}

export function ModelCard({ title, badge, badgeColor, description, icon: Icon, features, route, color = '#00d4ff', status }: ModelCardProps) {
  const navigate = useNavigate()

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: `0 8px 32px ${color}22` }}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${color}22`,
        borderRadius: 12,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${color}15`,
          border: `1px solid ${color}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={20} color={color} />
        </div>
        {badge && (
          <span style={{
            fontSize: 9, fontFamily: 'JetBrains Mono', fontWeight: 700,
            background: `${badgeColor ?? color}22`,
            color: badgeColor ?? color,
            border: `1px solid ${badgeColor ?? color}44`,
            padding: '3px 7px', borderRadius: 4
          }}>{badge}</span>
        )}
      </div>

      <div>
        <h3 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 17, color: 'var(--text-primary)', marginBottom: 4 }}>
          {title}
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{description}</p>
      </div>

      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {features.map(f => (
          <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span style={{ color, fontSize: 10 }}>▸</span>{f}
          </li>
        ))}
      </ul>

      {status && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
          {status}
        </div>
      )}

      <GlowButton
        variant="cyan"
        size="sm"
        onClick={() => navigate(route)}
      >
        Launch <ArrowRight size={12} />
      </GlowButton>

      {/* Accent corner */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 60, height: 60,
        background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`
      }} />
    </motion.div>
  )
}
