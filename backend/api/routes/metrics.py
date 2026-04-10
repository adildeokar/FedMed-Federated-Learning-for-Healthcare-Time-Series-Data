"""
Metrics and comparison endpoints
"""
from fastapi import APIRouter

router = APIRouter()

# Mock default results for when no training has been run
DEFAULT_RESULTS = {
    "centralized": {
        "test_accuracy": 0.912,
        "test_f1": 0.908,
        "total_time": 45.2,
        "training_type": "centralized",
        "privacy_score": 0,
        "scalability": "low"
    },
    "distributed": {
        "test_accuracy": 0.898,
        "test_f1": 0.891,
        "total_time": 28.1,
        "training_type": "distributed",
        "privacy_score": 20,
        "scalability": "medium"
    },
    "federated": {
        "final_accuracy": 0.873,
        "final_f1": 0.866,
        "total_rounds": 10,
        "n_clients": 5,
        "training_type": "federated",
        "privacy_score": 95,
        "scalability": "high"
    }
}


@router.get("/comparison")
async def get_comparison():
    """Get comparison metrics across all training types"""
    return {
        "comparison": DEFAULT_RESULTS,
        "is_mock": True
    }


@router.get("/default")
async def get_default_metrics():
    """Get default demo metrics"""
    return DEFAULT_RESULTS
