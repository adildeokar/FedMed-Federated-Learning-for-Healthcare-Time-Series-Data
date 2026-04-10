import { create } from 'zustand'
import type {
  TrainingType, TrainingConfig, EpochMetric, RoundMetric,
  ClientMetric, TrainingResults, ClientState, TrainingMessage
} from '../types/training'

interface TrainingStore {
  // Connection
  wsConnected: boolean
  setWsConnected: (v: boolean) => void

  // Active job
  activeJobId: string | null
  isTraining: boolean
  trainingType: TrainingType | null
  config: TrainingConfig | null

  // Progress
  currentEpoch: number
  currentRound: number
  currentLoss: number
  currentAccuracy: number
  currentF1: number
  progress: number
  statusMessage: string

  // History
  epochHistory: EpochMetric[]
  roundHistory: RoundMetric[]
  clientHistory: Record<number, ClientMetric[]>

  // Federated client states
  clientStates: Record<number, ClientState>
  activeClientId: number | null

  // Training logs
  trainingLogs: Array<{ time: string; message: string; type: string }>

  // Results
  centralizedResults: TrainingResults | null
  distributedResults: TrainingResults | null
  federatedResults: TrainingResults | null

  // Actions
  startTraining: (config: TrainingConfig, jobId: string) => void
  stopTraining: () => void
  resetStore: () => void
  handleWebSocketMessage: (msg: TrainingMessage & { job_id?: string }) => void
  addLog: (message: string, type?: string) => void
}

const initialState = {
  wsConnected: false,
  activeJobId: null,
  isTraining: false,
  trainingType: null,
  config: null,
  currentEpoch: 0,
  currentRound: 0,
  currentLoss: 0,
  currentAccuracy: 0,
  currentF1: 0,
  progress: 0,
  statusMessage: 'Idle',
  epochHistory: [],
  roundHistory: [],
  clientHistory: {},
  clientStates: {},
  activeClientId: null,
  trainingLogs: [],
  centralizedResults: null,
  distributedResults: null,
  federatedResults: null,
}

export const useTrainingStore = create<TrainingStore>((set, get) => ({
  ...initialState,

  setWsConnected: (v) => set({ wsConnected: v }),

  startTraining: (config, jobId) => {
    set({
      isTraining: true,
      trainingType: config.type,
      config,
      activeJobId: jobId,
      currentEpoch: 0,
      currentRound: 0,
      currentLoss: 0,
      currentAccuracy: 0,
      currentF1: 0,
      progress: 0,
      epochHistory: [],
      roundHistory: [],
      clientHistory: {},
      clientStates: {},
      trainingLogs: [],
      statusMessage: 'Starting...'
    })
    get().addLog(`Training started: ${config.type.toUpperCase()}`, 'round')
  },

  stopTraining: () => {
    set({ isTraining: false, statusMessage: 'Stopped' })
    get().addLog('Training stopped by user', 'error')
  },

  resetStore: () => set(initialState),

  addLog: (message, type = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false })
    set(state => ({
      trainingLogs: [...state.trainingLogs.slice(-200), { time, message, type }]
    }))
  },

  handleWebSocketMessage: (msg) => {
    const { addLog } = get()

    switch (msg.type) {
      case 'job_started':
        addLog(`Job ${msg.job_id} started`, 'round')
        break

      case 'loading':
        set({ statusMessage: msg.message })
        addLog(msg.message, 'info')
        break

      case 'dataset_loaded':
        addLog(`Dataset loaded: ${msg.stats.train_samples} train, ${msg.stats.test_samples} test, ${msg.stats.n_classes} classes`, 'client')
        break

      case 'batch_update':
        set({
          currentEpoch: msg.epoch,
          currentLoss: msg.loss,
          progress: msg.progress,
          statusMessage: `Epoch ${msg.epoch} — Batch ${msg.batch}/${msg.total_batches}`
        })
        break

      case 'epoch_complete':
        set(state => ({
          currentEpoch: msg.epoch,
          currentLoss: msg.val_loss,
          currentAccuracy: msg.val_accuracy,
          currentF1: msg.val_f1,
          progress: (msg.epoch / (state.config?.epochs || 15)) * 100,
          statusMessage: `Epoch ${msg.epoch} complete`,
          epochHistory: [...state.epochHistory, {
            epoch: msg.epoch,
            train_loss: msg.train_loss,
            val_loss: msg.val_loss,
            val_accuracy: msg.val_accuracy,
            val_f1: msg.val_f1,
            epoch_time: msg.epoch_time,
            elapsed: msg.elapsed
          }]
        }))
        addLog(`[Epoch ${msg.epoch}] acc: ${(msg.val_accuracy * 100).toFixed(1)}% | loss: ${msg.val_loss.toFixed(4)}`, 'eval')
        break

      case 'round_start':
        set({ statusMessage: `Round ${msg.round}/${msg.total_rounds} — Training ${msg.n_clients} clients` })
        addLog(`[Round ${msg.round}/${msg.total_rounds}] ──────────────────`, 'round')
        break

      case 'client_update': {
        const newStates = { ...get().clientStates }
        // Mark previous clients as done
        for (let i = 0; i < msg.client_id; i++) {
          if (newStates[i] === 'training') newStates[i] = 'sending'
        }
        newStates[msg.client_id] = 'training'
        set({
          clientStates: newStates,
          activeClientId: msg.client_id,
          statusMessage: `Round ${msg.round} — Client ${msg.client_id} training...`
        })
        addLog(`[Client ${msg.client_id}] Training... loss: ${msg.loss.toFixed(4)} (${msg.n_samples} samples)`, 'client')
        break
      }

      case 'aggregating':
        set(state => {
          const allDone = { ...state.clientStates }
          Object.keys(allDone).forEach(k => { allDone[parseInt(k)] = 'done' })
          return { clientStates: allDone, statusMessage: msg.message }
        })
        addLog(`[Aggregation] FedAvg → Global model update`, 'agg')
        break

      case 'round_complete':
        set(state => ({
          currentRound: msg.round,
          currentAccuracy: msg.accuracy,
          currentF1: msg.f1_score,
          currentLoss: msg.loss,
          progress: (msg.round / (state.config?.n_rounds || 10)) * 100,
          statusMessage: `Round ${msg.round} complete — Acc: ${(msg.accuracy * 100).toFixed(1)}%`,
          roundHistory: [...state.roundHistory, {
            round: msg.round,
            accuracy: msg.accuracy,
            f1_score: msg.f1_score,
            loss: msg.loss,
            round_time: msg.round_time,
            client_metrics: msg.client_metrics,
            confusion_matrix: msg.confusion_matrix,
            communication_cost_kb: msg.communication_cost_kb,
            n_clients_participated: msg.client_metrics?.length || 0
          }],
          clientStates: Object.fromEntries(
            Object.keys(state.clientStates).map(k => [k, 'done' as ClientState])
          )
        }))
        addLog(`[Evaluation] Accuracy: ${(msg.accuracy * 100).toFixed(1)}% | F1: ${msg.f1_score.toFixed(3)} | Loss: ${msg.loss.toFixed(4)}`, 'eval')
        break

      case 'worker_update':
        addLog(`[Worker ${msg.worker_id}] Epoch ${msg.epoch} loss: ${msg.loss.toFixed(4)}`, 'client')
        break

      case 'training_complete': {
        const results = msg.results
        const trainingType = get().trainingType
        set(state => ({
          isTraining: false,
          activeJobId: null,
          progress: 100,
          statusMessage: 'Training complete!',
          centralizedResults: trainingType === 'centralized' ? results : state.centralizedResults,
          distributedResults: trainingType === 'distributed' ? results : state.distributedResults,
          federatedResults: trainingType === 'federated' ? results : state.federatedResults,
        }))
        const acc = results.test_accuracy ?? results.final_accuracy ?? 0
        addLog(`✓ Training complete! Final accuracy: ${(acc * 100).toFixed(1)}%`, 'eval')
        break
      }

      case 'error':
        set({ isTraining: false, statusMessage: `Error: ${msg.message}` })
        addLog(`ERROR: ${msg.message}`, 'error')
        break

      default:
        break
    }
  }
}))
