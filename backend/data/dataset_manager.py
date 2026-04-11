"""
Unified dataset interface for ECG and HAR datasets
"""
from data.ecg_loader import load_ecg_dataset, get_sample_signals
from data.har_loader import load_har_dataset

_cache = {}


def get_dataset(dataset_type: str, use_real=None):
    """Get dataset with caching. ECG use_real None = auto-detect MIT-BIH CSVs."""
    key = f"{dataset_type}_{use_real}"
    if key not in _cache:
        if dataset_type == 'ecg':
            _cache[key] = load_ecg_dataset(use_real=use_real)
        elif dataset_type == 'har':
            _cache[key] = load_har_dataset(use_real=False if use_real is None else use_real)
        else:
            raise ValueError(f"Unknown dataset type: {dataset_type}")
    return _cache[key]


def get_dataset_info(dataset_type: str):
    """Get dataset statistics without loading the full dataset"""
    dataset = get_dataset(dataset_type)
    info = {
        'type': dataset_type,
        'n_classes': dataset['n_classes'],
        'classes': dataset['classes'],
        'train_samples': len(dataset['X_train']),
        'val_samples': len(dataset['X_val']),
        'test_samples': len(dataset['X_test']),
        'sample_shape': list(dataset['X_train'].shape[1:]),
    }
    if dataset_type == 'ecg':
        info['sample_length'] = dataset.get('sample_length', 187)
        info['class_names'] = dataset.get('class_names', dataset['classes'])
    elif dataset_type == 'har':
        info['sequence_length'] = dataset.get('sequence_length', 128)
        info['n_features'] = dataset.get('n_features', 9)
    return info
