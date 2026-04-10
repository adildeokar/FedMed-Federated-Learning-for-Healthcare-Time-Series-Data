"""
WebSocket Connection Manager for real-time training updates
"""
from fastapi import WebSocket
from typing import Dict
import json


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        print(f"[WS] Client {client_id} connected. Total: {len(self.active_connections)}")

    def disconnect(self, client_id: str):
        self.active_connections.pop(client_id, None)
        print(f"[WS] Client {client_id} disconnected. Total: {len(self.active_connections)}")

    async def send_personal_message(self, data: dict, client_id: str):
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_text(json.dumps(data, default=float))
            except Exception as e:
                print(f"[WS] Error sending to {client_id}: {e}")
                self.disconnect(client_id)

    async def broadcast(self, data: dict):
        disconnected = []
        for client_id, ws in self.active_connections.items():
            try:
                await ws.send_text(json.dumps(data, default=float))
            except Exception:
                disconnected.append(client_id)
        for client_id in disconnected:
            self.disconnect(client_id)

    def get_connection_count(self):
        return len(self.active_connections)
