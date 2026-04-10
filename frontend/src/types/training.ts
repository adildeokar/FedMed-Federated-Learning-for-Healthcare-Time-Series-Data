export type TrainingType = 'centralized' | 'distributed' | 'federated'
export type DatasetType = 'ecg' | 'har'
export type ModelType = 'cnn' | 'lstm'
export type ClientState = 'idle' | 'training' | 'sending' | 'done'

export interface TrainingConfig {
  type: TrainingType
  dataset: DatasetType
  model: ModelType
  epochs?: number
  lr?: number
  batch_size?: number
  n_clients?: number
  n_rounds?: number
  local_epochs?: number
  n_workers?: number
  iid?: boolean
}

export interface EpochMetric {
  epoch: number
  train_loss: number
  val_loss: number
  val_accuracy: number
  val_f1: number
  epoch_time: number
  elapsed: number
}

export interface RoundMetric {
  round: number
  accuracy: number
  f1_score: number
  loss: number
  round_time: number
  client_metrics: ClientMetric[]
  confusion_matrix: number[][]
  communication_cost_kb: number
  n_clients_participated: number
}

export interface ClientMetric {
  client_id: number
  n_samples: number
  loss: number
  dominant_classes: number[]
}

export interface WorkerMetric {
  worker_id: number
  loss: number
  epoch: number
}

export interface TrainingResults {
  // Centralized / Distributed
  epoch_metrics?: EpochMetric[]
  test_accuracy?: number
  test_f1?: number
  total_time?: number
  confusion_matrix?: number[][]
  n_workers?: number
  speedup_factor?: number
  // Federated
  round_metrics?: RoundMetric[]
  final_accuracy?: number
  final_f1?: number
  total_rounds?: number
  n_clients?: number
  aggregation?: string
}

export type TrainingMessage =
  | { type: 'batch_update'; epoch: number; batch: number; total_batches: number; loss: number; progress: number }
  | { type: 'epoch_start'; epoch: number; n_workers?: number }
  | { type: 'epoch_complete'; epoch: number; train_loss: number; val_loss: number; val_accuracy: number; val_f1: number; epoch_time: number; elapsed: number; worker_losses?: number[]; speedup?: number }
  | { type: 'worker_update'; epoch: number; worker_id: number; loss: number; progress: number }
  | { type: 'round_start'; round: number; total_rounds: number; n_clients: number }
  | { type: 'client_update'; round: number; client_id: number; loss: number; n_samples: number; progress: number }
  | { type: 'aggregating'; round: number; message: string }
  | { type: 'round_complete'; round: number; accuracy: number; f1_score: number; loss: number; round_time: number; client_metrics: ClientMetric[]; confusion_matrix: number[][]; communication_cost_kb: number }
  | { type: 'training_complete'; results: TrainingResults }
  | { type: 'dataset_loaded'; stats: { train_samples: number; test_samples: number; n_classes: number } }
  | { type: 'loading'; message: string }
  | { type: 'job_started'; job_id: string }
  | { type: 'error'; message: string }
  | { type: 'pong' }

export interface ComparisonData {
  centralized: { accuracy: number; f1: number; time: number; privacy: number }
  distributed: { accuracy: number; f1: number; time: number; privacy: number }
  federated: { accuracy: number; f1: number; time: number; privacy: number }
}
