import { useCallback } from 'react'
import { useTrainingStore } from '../store/trainingStore'
import { useWebSocket } from './useWebSocket'
import type { TrainingConfig } from '../types/training'

export function useTraining() {
  const store = useTrainingStore()
  const { sendStartTraining, sendStopTraining } = useWebSocket()

  const startTraining = useCallback((config: TrainingConfig) => {
    const jobId = `job-${Date.now().toString(36)}`
    store.startTraining(config, jobId)
    sendStartTraining(config)
  }, [store, sendStartTraining])

  const stopTraining = useCallback(() => {
    store.stopTraining()
    sendStopTraining()
  }, [store, sendStopTraining])

  return {
    ...store,
    startTraining,
    stopTraining
  }
}
