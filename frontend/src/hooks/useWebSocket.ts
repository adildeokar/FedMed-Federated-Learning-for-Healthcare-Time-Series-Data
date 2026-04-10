import { useEffect, useRef, useCallback } from 'react'
import { useTrainingStore } from '../store/trainingStore'
import type { TrainingConfig } from '../types/training'

const WS_URL = 'ws://localhost:8000/ws'

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const clientId = useRef(`fedmed-${Math.random().toString(36).slice(2, 8)}`)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isUnmounted = useRef(false)

  const { setWsConnected, handleWebSocketMessage, startTraining, activeJobId } = useTrainingStore()

  const connect = useCallback(() => {
    if (isUnmounted.current) return
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      const ws = new WebSocket(`${WS_URL}/${clientId.current}`)
      wsRef.current = ws

      ws.onopen = () => {
        setWsConnected(true)
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current)
          reconnectTimer.current = null
        }
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          handleWebSocketMessage(msg)
        } catch (e) {
          console.error('WS parse error:', e)
        }
      }

      ws.onclose = () => {
        setWsConnected(false)
        if (!isUnmounted.current) {
          reconnectTimer.current = setTimeout(connect, 3000)
        }
      }

      ws.onerror = () => {
        ws.close()
      }
    } catch (e) {
      if (!isUnmounted.current) {
        reconnectTimer.current = setTimeout(connect, 3000)
      }
    }
  }, [setWsConnected, handleWebSocketMessage])

  useEffect(() => {
    isUnmounted.current = false
    connect()
    return () => {
      isUnmounted.current = true
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  const sendStartTraining = useCallback((config: TrainingConfig) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'start_training', config }))
    }
  }, [])

  const sendStopTraining = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && activeJobId) {
      wsRef.current.send(JSON.stringify({ type: 'stop_training', job_id: activeJobId }))
    }
  }, [activeJobId])

  return { sendStartTraining, sendStopTraining, clientId: clientId.current }
}
