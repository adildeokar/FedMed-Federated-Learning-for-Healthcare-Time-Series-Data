"""
FedMed FastAPI Server
Real-time training dashboard backend with WebSocket support
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import uuid
from typing import Dict, Any

from api.routes import training, datasets, metrics, models_router
from api.websocket import ConnectionManager

app = FastAPI(title="FedMed API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

manager = ConnectionManager()
active_jobs: Dict[str, Any] = {}

app.include_router(training.router, prefix="/api/training", tags=["training"])
app.include_router(datasets.router, prefix="/api/datasets", tags=["datasets"])
app.include_router(metrics.router, prefix="/api/metrics", tags=["metrics"])
app.include_router(models_router.router, prefix="/api/models", tags=["models"])


@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)

            if msg.get('type') == 'start_training':
                job_id = str(uuid.uuid4())[:8]
                asyncio.create_task(
                    run_training_job(job_id, msg['config'], client_id)
                )
                await manager.send_personal_message({'type': 'job_started', 'job_id': job_id}, client_id)

            elif msg.get('type') == 'stop_training':
                job_id = msg.get('job_id')
                if job_id in active_jobs:
                    active_jobs[job_id]['stop'] = True

            elif msg.get('type') == 'ping':
                await manager.send_personal_message({'type': 'pong'}, client_id)

    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception:
        manager.disconnect(client_id)


async def run_training_job(job_id: str, config: dict, ws_client_id: str):
    """Run a training job and stream updates via WebSocket"""
    from data.ecg_loader import load_ecg_dataset
    from data.har_loader import load_har_dataset
    from models.cnn_ecg import ECGClassifier, LSTMECGClassifier
    from models.cnn_har import HARClassifier
    from training.centralized import CentralizedTrainer
    from training.distributed import DistributedTrainer
    from flower.simulation import FederatedSimulator

    active_jobs[job_id] = {'stop': False}

    training_type = config.get('type', 'federated')
    dataset_type = config.get('dataset', 'ecg')
    model_type = config.get('model', 'cnn')

    async def emit(data):
        if active_jobs.get(job_id, {}).get('stop'):
            return
        await manager.send_personal_message({'job_id': job_id, **data}, ws_client_id)

    try:
        await emit({'type': 'loading', 'message': 'Loading dataset...'})

        if dataset_type == 'ecg':
            dataset = load_ecg_dataset()
            ModelClass = ECGClassifier if model_type == 'cnn' else LSTMECGClassifier
        else:
            dataset = load_har_dataset()
            ModelClass = HARClassifier

        await emit({'type': 'dataset_loaded', 'stats': {
            'train_samples': len(dataset['X_train']),
            'test_samples': len(dataset['X_test']),
            'n_classes': dataset['n_classes']
        }})

        if training_type == 'centralized':
            model = ModelClass()
            trainer = CentralizedTrainer(
                model, dataset,
                epochs=config.get('epochs', 15),
                lr=config.get('lr', 0.001),
                callback=emit
            )
            results = await trainer.train()

        elif training_type == 'federated':
            simulator = FederatedSimulator(
                ModelClass, dataset,
                n_clients=config.get('n_clients', 5),
                iid=config.get('iid', True),
                n_rounds=config.get('n_rounds', 10),
                local_epochs=config.get('local_epochs', 3),
                lr=config.get('lr', 0.001),
                callback=emit
            )
            results = await simulator.run()

        elif training_type == 'distributed':
            trainer = DistributedTrainer(
                ModelClass, dataset,
                n_workers=config.get('n_workers', 3),
                epochs=config.get('epochs', 15),
                lr=config.get('lr', 0.001),
                callback=emit
            )
            results = await trainer.train()
        else:
            results = {}

        await emit({'type': 'training_complete', 'results': results})

    except Exception as e:
        import traceback
        await emit({'type': 'error', 'message': str(e), 'traceback': traceback.format_exc()})
    finally:
        active_jobs.pop(job_id, None)


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


@app.get("/")
async def root():
    return {"message": "FedMed API is running", "docs": "/docs"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
