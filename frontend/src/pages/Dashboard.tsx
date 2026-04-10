import React from 'react'
import { motion } from 'framer-motion'
import { Activity, Users, Wifi, BarChart3, Share2, Server, GitBranch, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ECGWaveform } from '../components/charts/ECGWaveform'
import { StatsCard } from '../components/dashboard/StatsCard'
import { ModelCard } from '../components/dashboard/ModelCard'
import { ParticleBackground } from '../components/ui/ParticleBackground'
import { useTrainingStore } from '../store/trainingStore'

export function Dashboard() {
  const navigate = useNavigate()
  const { federatedResults, centralizedResults, distributedResults, roundHistory } = useTrainingStore()

  const bestFL = federatedResults?.final_accuracy
    ?? roundHistory[roundHistory.length - 1]?.accuracy ?? 0.873
  const totalExperiments = (federatedResults ? 1 : 0) + (centralizedResults ? 1 : 0) + (distributedResults ? 1 : 0)
  const bestRounds = federatedResults?.total_rounds ?? roundHistory.length

  const recentActivity = [
    ...(federatedResults ? [{ type: 'Federated', acc: (federatedResults.final_accuracy ?? 0) * 100, f1: federatedResults.final_f1 ?? 0, time: 'Latest', color: '#00d4ff' }] : []),
    ...(centralizedResults ? [{ type: 'Centralized', acc: (centralizedResults.test_accuracy ?? 0) * 100, f1: centralizedResults.test_f1 ?? 0, time: 'Latest', color: '#3b82f6' }] : []),
    ...(distributedResults ? [{ type: 'Distributed', acc: (distributedResults.test_accuracy ?? 0) * 100, f1: distributedResults.test_f1 ?? 0, time: 'Latest', color: '#8b5cf6' }] : []),
    { type: 'Demo FL', acc: 87.3, f1: 0.866, time: '—', color: '#00d4ff' },
    { type: 'Demo Central', acc: 91.2, f1: 0.908, time: '—', color: '#3b82f6' },
    { type: 'Demo Dist.', acc: 89.8, f1: 0.891, time: '—', color: '#8b5cf6' },
  ].slice(0, 6)

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Hero */}
      <div style={{
        position: 'relative',
        background: 'var(--bg-card)',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        minHeight: 220
      }}>
        <ParticleBackground count={30} />

        {/* ECG background */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, opacity: 0.15 }}>
          <ECGWaveform color="#00d4ff" height={100} animated />
        </div>

        <div style={{ position: 'relative', zIndex: 1, padding: '32px 40px' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{
                fontSize: 10, fontFamily: 'JetBrains Mono',
                background: 'rgba(0, 212, 255, 0.15)', color: '#00d4ff',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                padding: '3px 8px', borderRadius: 4
              }}>FEDERATED LEARNING</span>
              <span style={{
                fontSize: 10, fontFamily: 'JetBrains Mono',
                background: 'rgba(0, 255, 136, 0.1)', color: '#00ff88',
                border: '1px solid rgba(0, 255, 136, 0.3)',
                padding: '3px 8px', borderRadius: 4
              }}>HEALTHCARE AI</span>
            </div>
            <h1 style={{
              fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 48,
              color: '#00d4ff', textShadow: '0 0 30px rgba(0,212,255,0.5)',
              lineHeight: 1, marginBottom: 8
            }}>
              FedMed
            </h1>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 600, lineHeight: 1.6 }}>
              Federated Learning for Healthcare Time-Series Data.
              Privacy-preserving ECG & wearable sensor classification across distributed clients.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button
                onClick={() => navigate('/federated')}
                style={{
                  padding: '10px 20px', fontSize: 13, fontWeight: 600,
                  background: 'rgba(0,212,255,0.15)',
                  border: '1px solid rgba(0,212,255,0.4)',
                  color: '#00d4ff', borderRadius: 8, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                <Share2 size={14} /> Launch Federated Training <ArrowRight size={12} />
              </button>
              <button
                onClick={() => navigate('/comparison')}
                style={{
                  padding: '10px 20px', fontSize: 13,
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-secondary)', borderRadius: 8, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                <BarChart3 size={14} /> View Comparison
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatsCard title="Experiments Run" value={totalExperiments} decimals={0} icon={Activity} color="#00d4ff" subtitle="This session" />
        <StatsCard title="Best FL Accuracy" value={bestFL * 100} suffix="%" decimals={1} icon={BarChart3} color="#00ff88" />
        <StatsCard title="FL Rounds" value={bestRounds} decimals={0} icon={Wifi} color="#ffb800" subtitle="Communication rounds" />
        <StatsCard title="Active Clients" value={5} decimals={0} icon={Users} color="#8b5cf6" subtitle="Simulated wearables" />
      </div>

      {/* Project Cards */}
      <div>
        <h2 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 20, color: 'var(--text-primary)', marginBottom: 16 }}>
          Projects
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <ModelCard
            title="Federated Learning"
            badge="MINI P3 + MAJOR P2"
            badgeColor="#00d4ff"
            description="Privacy-preserving ECG classification using FedAvg across simulated wearable device clients."
            icon={Share2}
            features={['Flower-style FedAvg', 'ECG + HAR datasets', 'Real-time topology viz', '5-10 simulated clients']}
            route="/federated"
            color="#00d4ff"
          />
          <ModelCard
            title="Centralized Training"
            badge="BASELINE"
            badgeColor="#3b82f6"
            description="Standard centralized training for baseline comparison. Full dataset access."
            icon={Server}
            features={['CNN + BiLSTM models', 'Full dataset access', 'Live training curves', 'Best accuracy baseline']}
            route="/centralized"
            color="#3b82f6"
          />
          <ModelCard
            title="Distributed Training"
            badge="DATA PARALLEL"
            badgeColor="#8b5cf6"
            description="Simulated data-parallel distributed training with AllReduce gradient synchronization."
            icon={GitBranch}
            features={['2-4 worker simulation', 'AllReduce averaging', 'Speedup metrics', 'Memory usage tracking']}
            route="/distributed"
            color="#8b5cf6"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 20, color: 'var(--text-primary)', marginBottom: 16 }}>
          Recent Activity
        </h2>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          overflow: 'hidden'
        }}>
          {recentActivity.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '12px 20px',
              borderBottom: i < recentActivity.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: item.color, boxShadow: `0 0 6px ${item.color}`
              }} />
              <span style={{
                fontSize: 12, fontFamily: 'JetBrains Mono',
                color: item.color, minWidth: 120
              }}>{item.type}</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Accuracy: <strong style={{ color: '#00d4ff', fontFamily: 'JetBrains Mono' }}>{item.acc.toFixed(1)}%</strong>
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                F1: <strong style={{ color: '#00ff88', fontFamily: 'JetBrains Mono' }}>{item.f1.toFixed(3)}</strong>
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
