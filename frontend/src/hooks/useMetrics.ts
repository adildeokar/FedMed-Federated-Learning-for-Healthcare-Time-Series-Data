import { useQuery } from '@tanstack/react-query'

const API_BASE = 'http://localhost:8000/api'

export function useDefaultMetrics() {
  return useQuery({
    queryKey: ['default-metrics'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/metrics/default`)
      return res.json()
    },
    staleTime: Infinity
  })
}

export function useDatasetInfo(datasetType: string) {
  return useQuery({
    queryKey: ['dataset-info', datasetType],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/datasets/info/${datasetType}`)
      return res.json()
    },
    staleTime: 60000
  })
}

export function useDatasetSamples(datasetType: string) {
  return useQuery({
    queryKey: ['dataset-samples', datasetType],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/datasets/samples/${datasetType}`)
      return res.json()
    },
    staleTime: 60000
  })
}

export function useFederatedPartition(datasetType: string, nClients: number, iid: boolean) {
  return useQuery({
    queryKey: ['partition', datasetType, nClients, iid],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/datasets/partition/${datasetType}?n_clients=${nClients}&iid=${iid}`)
      return res.json()
    },
    staleTime: 30000
  })
}

export function usePresets() {
  return useQuery({
    queryKey: ['presets'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/training/presets`)
      return res.json()
    },
    staleTime: Infinity
  })
}
