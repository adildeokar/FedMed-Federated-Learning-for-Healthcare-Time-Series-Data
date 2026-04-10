"""
Training REST endpoints
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class TrainingConfig(BaseModel):
    type: str = "federated"  # centralized | distributed | federated
    dataset: str = "ecg"     # ecg | har
    model: str = "cnn"       # cnn | lstm
    epochs: Optional[int] = 15
    lr: Optional[float] = 0.001
    batch_size: Optional[int] = 64
    n_clients: Optional[int] = 5
    n_rounds: Optional[int] = 10
    local_epochs: Optional[int] = 3
    n_workers: Optional[int] = 3
    iid: Optional[bool] = True


@router.get("/presets")
async def get_presets():
    """Get training presets for quick demo"""
    return {
        "presets": [
            {
                "id": "quick_demo",
                "name": "Quick Demo",
                "description": "Fast demo with fewer rounds",
                "config": {
                    "type": "federated", "dataset": "ecg", "model": "cnn",
                    "n_clients": 3, "n_rounds": 5, "local_epochs": 2
                }
            },
            {
                "id": "standard",
                "name": "Standard",
                "description": "Balanced experiment settings",
                "config": {
                    "type": "federated", "dataset": "ecg", "model": "cnn",
                    "n_clients": 5, "n_rounds": 10, "local_epochs": 3
                }
            },
            {
                "id": "full_experiment",
                "name": "Full Experiment",
                "description": "Complete experiment for best results",
                "config": {
                    "type": "federated", "dataset": "ecg", "model": "cnn",
                    "n_clients": 10, "n_rounds": 20, "local_epochs": 5
                }
            }
        ]
    }


@router.get("/status")
async def get_training_status():
    """Get status of active training jobs"""
    return {"active_jobs": 0, "status": "idle"}
