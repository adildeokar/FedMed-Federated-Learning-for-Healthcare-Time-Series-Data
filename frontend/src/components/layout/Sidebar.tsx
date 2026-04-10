import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Database, GitBranch, Server, Share2, BarChart3, Info
} from 'lucide-react'
import { useTrainingStore } from '../../store/trainingStore'
import { PulseIndicator } from '../ui/PulseIndicator'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/data', icon: Database, label: 'Data Explorer' },
  { path: '/federated', icon: Share2, label: 'Federated Training', badge: 'MAIN' },
  { path: '/centralized', icon: Server, label: 'Centralized' },
  { path: '/distributed', icon: GitBranch, label: 'Distributed' },
  { path: '/comparison', icon: BarChart3, label: 'Comparison' },
  { path: '/about', icon: Info, label: 'About' },
]

export function Sidebar() {
  const location = useLocation()
  const { isTraining, wsConnected } = useTrainingStore()

  return (
    <aside style={{
      width: 220,
      minWidth: 220,
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 0',
      zIndex: 10
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: '#000'
          }}>F</div>
          <div>
            <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 18, color: 'var(--accent-primary)' }}>
              FedMed
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
              FL Healthcare
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PulseIndicator active={wsConnected} color={wsConnected ? '#00ff88' : '#ff4757'} size={8} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
            {wsConnected ? 'Backend Connected' : 'Connecting...'}
          </span>
        </div>
        {isTraining && (
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <PulseIndicator active color='#ffb800' size={8} />
            <span style={{ fontSize: 11, color: '#ffb800', fontFamily: 'JetBrains Mono' }}>Training Active</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {navItems.map(({ path, icon: Icon, label, badge }) => {
          const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
          return (
            <NavLink key={path} to={path} style={{ textDecoration: 'none' }}>
              <motion.div
                whileHover={{ x: 4 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 20px',
                  margin: '2px 8px',
                  borderRadius: 8,
                  background: isActive ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
                  borderLeft: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                <Icon size={16} />
                <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400 }}>{label}</span>
                {badge && (
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: 9,
                    fontFamily: 'JetBrains Mono',
                    background: 'rgba(0, 212, 255, 0.15)',
                    color: 'var(--accent-primary)',
                    padding: '2px 5px',
                    borderRadius: 4,
                    border: '1px solid rgba(0, 212, 255, 0.3)'
                  }}>{badge}</span>
                )}
              </motion.div>
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
          Mini P3 + Major P2
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
          FedAvg • Flower • PyTorch
        </div>
      </div>
    </aside>
  )
}
