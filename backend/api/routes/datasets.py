"""
Dataset preview and statistics endpoints
"""
from fastapi import APIRouter
import numpy as np

router = APIRouter()


@router.get("/info/{dataset_type}")
async def get_dataset_info(dataset_type: str):
    """Get dataset statistics"""
    from data.dataset_manager import get_dataset_info
    try:
        info = get_dataset_info(dataset_type)
        return info
    except Exception as e:
        return {"error": str(e)}


@router.get("/samples/{dataset_type}")
async def get_sample_signals(dataset_type: str, n_per_class: int = 3):
    """Get sample signals for visualization"""
    try:
        if dataset_type == 'ecg':
            from data.ecg_loader import load_ecg_dataset, get_sample_signals
            dataset = load_ecg_dataset()
            samples = get_sample_signals(dataset, n_per_class)
            return {
                "dataset": "ecg",
                "samples": samples,
                "classes": ['N', 'S', 'V', 'F', 'Q'],
                "class_names": ['Normal', 'Supraventricular', 'Ventricular', 'Fusion', 'Unknown']
            }
        elif dataset_type == 'har':
            from data.har_loader import load_har_dataset
            dataset = load_har_dataset()
            samples = {}
            for cls_idx, cls_name in enumerate(dataset['classes']):
                indices = np.where(dataset['y_train'] == cls_idx)[0][:n_per_class]
                samples[cls_name] = dataset['X_train'][indices].tolist()
            return {
                "dataset": "har",
                "samples": samples,
                "classes": dataset['classes']
            }
    except Exception as e:
        return {"error": str(e)}


@router.get("/partition/{dataset_type}")
async def get_federated_partition(dataset_type: str, n_clients: int = 5, iid: bool = True):
    """Get federated data partition statistics"""
    try:
        if dataset_type == 'ecg':
            from data.ecg_loader import load_ecg_dataset, partition_for_federated
            dataset = load_ecg_dataset()
            partitions = partition_for_federated(dataset, n_clients, iid)
        else:
            from data.har_loader import load_har_dataset, partition_har_for_federated
            dataset = load_har_dataset()
            partitions = partition_har_for_federated(dataset, n_clients, iid)

        partition_stats = []
        for i, part in enumerate(partitions):
            y = part['y']
            unique, counts = np.unique(y, return_counts=True)
            class_dist = {int(k): int(v) for k, v in zip(unique, counts)}
            partition_stats.append({
                'client_id': i,
                'n_samples': int(part['n_samples']),
                'class_distribution': class_dist,
                'dominant_classes': [int(c) for c in part.get('dominant_classes', [])]
            })

        return {
            'n_clients': n_clients,
            'iid': iid,
            'partitions': partition_stats
        }
    except Exception as e:
        return {"error": str(e)}
