import React from 'react'
import { motion } from 'framer-motion'
import { ECGWaveform } from '../components/charts/ECGWaveform'

const techStack = {
  Frontend: ['React 18 + TypeScript', 'Vite 5', 'Tailwind CSS', 'Framer Motion', 'Recharts', 'Zustand', 'TanStack Query'],
  Backend: ['Python 3.10+', 'FastAPI', 'WebSockets', 'PyTorch 2.1', 'scikit-learn', 'NumPy / SciPy'],
  'FL Framework': ['Custom FedAvg (Flower-inspired)', 'FederatedSimulator class', 'Multi-client simulation', 'Real-time WebSocket callbacks'],
  Datasets: ['MIT-BIH Arrhythmia ECG (synthetic fallback)', 'UCI HAR Wearable Sensors (synthetic fallback)', '5-class ECG / 6-class activity recognition']
}

const flSteps = [
  { step: '1', title: 'Initialize', desc: 'Global model initialized on server. Dataset partitioned across N clients.' },
  { step: '2', title: 'Distribute', desc: 'Server sends current global model weights to all participating clients.' },
  { step: '3', title: 'Local Training', desc: 'Each client trains locally on their private data for E local epochs.' },
  { step: '4', title: 'Aggregate', desc: 'Server receives model updates and computes FedAvg weighted average.' },
  { step: '5', title: 'Evaluate', desc: 'Aggregated global model is evaluated on the test set.' },
  { step: '6', title: 'Repeat', desc: 'Repeat for R rounds until convergence or max rounds reached.' },
]

export function About() {
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 1000 }}>
      {/* Hero */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 16, padding: '32px', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, opacity: 0.1 }}>
          <ECGWaveform color="#00d4ff" height={80} animated />
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <span style={{
              fontSize: 9, fontFamily: 'JetBrains Mono',
              background: 'rgba(0,212,255,0.15)', color: '#00d4ff',
              border: '1px solid rgba(0,212,255,0.3)', padding: '2px 8px', borderRadius: 4
            }}>MINI PROJECT 3</span>
            <span style={{
              fontSize: 9, fontFamily: 'JetBrains Mono',
              background: 'rgba(0,255,136,0.1)', color: '#00ff88',
              border: '1px solid rgba(0,255,136,0.3)', padding: '2px 8px', borderRadius: 4
            }}>MAJOR PROJECT 2</span>
          </div>
          <h1 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 36, color: '#00d4ff', marginBottom: 8 }}>
            FedMed — Federated Learning for Healthcare
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 600 }}>
            A full-stack research platform demonstrating federated learning applied to ECG arrhythmia detection
            and wearable sensor activity recognition. Designed as a complete demonstration of privacy-preserving
            machine learning for distributed healthcare IoT devices.
          </p>
        </div>
      </div>

      {/* FL Algorithm */}
      <div>
        <h2 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 22, color: 'var(--text-primary)', marginBottom: 16 }}>
          How Federated Learning Works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {flSteps.map(({ step, title, desc }) => (
            <motion.div
              key={step}
              whileHover={{ y: -2, borderColor: 'rgba(0,212,255,0.3)' }}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                borderRadius: 10, padding: '14px 16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontFamily: 'JetBrains Mono', color: '#00d4ff', fontWeight: 700
                }}>{step}</div>
                <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 15, color: '#00d4ff' }}>{title}</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div>
        <h2 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 22, color: 'var(--text-primary)', marginBottom: 16 }}>
          Technology Stack
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {Object.entries(techStack).map(([category, items]) => (
            <div key={category} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderRadius: 12, padding: '16px'
            }}>
              <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 15, color: '#00d4ff', marginBottom: 10 }}>
                {category}
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {items.map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span style={{ color: '#00ff88', fontSize: 10 }}>▸</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Evaluation Criteria */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '20px' }}>
        <h2 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 22, color: 'var(--text-primary)', marginBottom: 16 }}>
          Evaluation Criteria (Mini Project 3)
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { title: 'Communication Rounds', desc: 'Number of FL rounds to achieve target accuracy. FedMed tracks round-by-round convergence.', color: '#00d4ff' },
            { title: 'Model Convergence', desc: 'Loss and accuracy curves per round, showing FedAvg convergence across all participating clients.', color: '#00ff88' },
            { title: 'Client Participation', desc: 'All 5 simulated wearable device clients participate in every round (full participation).', color: '#ffb800' }
          ].map(({ title, desc, color }) => (
            <div key={title} style={{
              background: `${color}08`, border: `1px solid ${color}22`,
              borderRadius: 10, padding: '14px'
            }}>
              <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 14, color, marginBottom: 6 }}>✓ {title}</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick start */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '20px' }}>
        <h2 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 22, color: 'var(--text-primary)', marginBottom: 14 }}>
          Quick Start
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { title: 'Backend', code: 'cd backend\npip install -r requirements.txt\npython main.py', color: '#00ff88' },
            { title: 'Frontend', code: 'cd frontend\nnpm install\nnpm run dev', color: '#00d4ff' }
          ].map(({ title, code, color }) => (
            <div key={title}>
              <div style={{ fontSize: 13, color, fontFamily: 'Rajdhani', fontWeight: 700, marginBottom: 6 }}>{title}</div>
              <pre style={{
                background: 'var(--bg-secondary)', border: `1px solid ${color}22`,
                borderRadius: 8, padding: '12px 16px',
                fontSize: 12, color: 'var(--text-secondary)',
                fontFamily: 'JetBrains Mono', margin: 0, lineHeight: 1.8
              }}>{code}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
