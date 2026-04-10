import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { DataExplorer } from './pages/DataExplorer'
import { FederatedTraining } from './pages/FederatedTraining'
import { CentralizedTraining } from './pages/CentralizedTraining'
import { DistributedTraining } from './pages/DistributedTraining'
import { Comparison } from './pages/Comparison'
import { About } from './pages/About'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/data" element={<DataExplorer />} />
        <Route path="/federated" element={<FederatedTraining />} />
        <Route path="/centralized" element={<CentralizedTraining />} />
        <Route path="/distributed" element={<DistributedTraining />} />
        <Route path="/comparison" element={<Comparison />} />
        <Route path="/about" element={<About />} />
      </Route>
    </Routes>
  )
}
