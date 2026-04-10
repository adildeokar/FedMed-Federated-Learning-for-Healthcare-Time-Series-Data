import React from 'react'
import { motion } from 'framer-motion'

interface GlowButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'cyan' | 'green' | 'danger' | 'purple' | 'ghost'
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  type?: 'button' | 'submit'
  fullWidth?: boolean
}

const variants = {
  cyan: {
    bg: 'rgba(0, 212, 255, 0.1)',
    border: 'rgba(0, 212, 255, 0.4)',
    text: '#00d4ff',
    glow: '0 0 20px rgba(0, 212, 255, 0.4)',
    hover: 'rgba(0, 212, 255, 0.2)'
  },
  green: {
    bg: 'rgba(0, 255, 136, 0.1)',
    border: 'rgba(0, 255, 136, 0.4)',
    text: '#00ff88',
    glow: '0 0 20px rgba(0, 255, 136, 0.4)',
    hover: 'rgba(0, 255, 136, 0.2)'
  },
  danger: {
    bg: 'rgba(255, 71, 87, 0.1)',
    border: 'rgba(255, 71, 87, 0.4)',
    text: '#ff4757',
    glow: '0 0 20px rgba(255, 71, 87, 0.4)',
    hover: 'rgba(255, 71, 87, 0.2)'
  },
  purple: {
    bg: 'rgba(139, 92, 246, 0.1)',
    border: 'rgba(139, 92, 246, 0.4)',
    text: '#8b5cf6',
    glow: '0 0 20px rgba(139, 92, 246, 0.4)',
    hover: 'rgba(139, 92, 246, 0.2)'
  },
  ghost: {
    bg: 'transparent',
    border: 'rgba(148, 163, 184, 0.2)',
    text: '#94a3b8',
    glow: 'none',
    hover: 'rgba(148, 163, 184, 0.1)'
  }
}

const sizes = {
  sm: { padding: '6px 12px', fontSize: '12px' },
  md: { padding: '8px 18px', fontSize: '14px' },
  lg: { padding: '12px 24px', fontSize: '16px' }
}

export function GlowButton({
  children, onClick, variant = 'cyan', disabled = false,
  size = 'md', className = '', type = 'button', fullWidth = false
}: GlowButtonProps) {
  const v = variants[variant]
  const s = sizes[size]

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.03, boxShadow: v.glow } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      style={{
        background: disabled ? 'rgba(71, 85, 105, 0.2)' : v.bg,
        border: `1px solid ${disabled ? 'rgba(71, 85, 105, 0.3)' : v.border}`,
        color: disabled ? '#475569' : v.text,
        padding: s.padding,
        fontSize: s.fontSize,
        borderRadius: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: '"DM Sans", sans-serif',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        justifyContent: 'center',
        width: fullWidth ? '100%' : 'auto',
        transition: 'background 0.2s',
        outline: 'none'
      }}
      className={className}
    >
      {children}
    </motion.button>
  )
}
