"""
Model management endpoints
"""
from fastapi import APIRouter
from models.model_factory import AVAILABLE_MODELS, get_model_info

router = APIRouter()


@router.get("/list")
async def list_models():
    """List available models"""
    return {"models": AVAILABLE_MODELS}


@router.get("/info/{dataset_type}/{model_type}")
async def get_model_architecture(dataset_type: str, model_type: str):
    """Get model architecture information"""
    try:
        info = get_model_info(dataset_type, model_type)
        return info
    except Exception as e:
        return {"error": str(e)}
