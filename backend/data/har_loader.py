"""
HAR (Human Activity Recognition) Dataset Loader
UCI HAR Dataset — wearable accelerometer/gyroscope data
6 activities: Walking, Walking Upstairs, Walking Downstairs, Sitting, Standing, Laying
"""

import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import os

HAR_ACTIVITIES = ['Walking', 'Walking Upstairs', 'Walking Downstairs', 'Sitting', 'Standing', 'Laying']
HAR_SEQUENCE_LENGTH = 128
HAR_N_FEATURES = 9  # 3-axis acc + 3-axis gyro + 3-axis derived


def generate_synthetic_har_dataset(n_samples=4000, random_state=42):
    """
    Synthetic wearable sensor data with realistic per-activity signatures.
    """
    np.random.seed(random_state)
    X = []
    y = []
    samples_per_class = n_samples // 6
    t = np.linspace(0, 1, HAR_SEQUENCE_LENGTH)

    activity_params = {
        0: {'freq': 1.8, 'amp': 0.8, 'noise': 0.1},
        1: {'freq': 1.5, 'amp': 1.0, 'noise': 0.15},
        2: {'freq': 2.0, 'amp': 0.9, 'noise': 0.12},
        3: {'freq': 0.1, 'amp': 0.05, 'noise': 0.02},
        4: {'freq': 0.05, 'amp': 0.03, 'noise': 0.01},
        5: {'freq': 0.02, 'amp': 0.02, 'noise': 0.008}
    }

    for cls in range(6):
        params = activity_params[cls]
        for _ in range(samples_per_class):
            features = []
            for f in range(HAR_N_FEATURES):
                phase = np.random.uniform(0, 2 * np.pi)
                channel = (
                    params['amp'] * np.sin(2 * np.pi * params['freq'] * t + phase) +
                    params['noise'] * np.random.randn(HAR_SEQUENCE_LENGTH)
                )
                features.append(channel)
            X.append(np.array(features).T)  # Shape: (128, 9)
            y.append(cls)

    X = np.array(X, dtype=np.float32)
    y = np.array(y, dtype=np.int64)
    idx = np.random.permutation(len(X))
    return X[idx], y[idx]


def load_har_dataset(use_real=False, data_path='data/uci_har'):
    """Load HAR dataset - real or synthetic"""
    if use_real and os.path.exists(data_path):
        result = load_real_har(data_path)
        if result is not None:
            return result

    print("[HAR] Using synthetic wearable sensor dataset (demo mode)")
    X, y = generate_synthetic_har_dataset()

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    X_train, X_val, y_train, y_val = train_test_split(X_train, y_train, test_size=0.1, stratify=y_train, random_state=42)

    return {
        'X_train': X_train, 'y_train': y_train,
        'X_val': X_val, 'y_val': y_val,
        'X_test': X_test, 'y_test': y_test,
        'classes': HAR_ACTIVITIES,
        'class_names': HAR_ACTIVITIES,
        'n_classes': 6,
        'sequence_length': HAR_SEQUENCE_LENGTH,
        'n_features': HAR_N_FEATURES,
        'sample_length': HAR_SEQUENCE_LENGTH
    }


def load_real_har(data_path):
    """Load real UCI HAR dataset"""
    try:
        import pandas as pd
        X_train = np.loadtxt(os.path.join(data_path, 'train/X_train.txt'))
        y_train = np.loadtxt(os.path.join(data_path, 'train/y_train.txt'), dtype=np.int64) - 1
        X_test = np.loadtxt(os.path.join(data_path, 'test/X_test.txt'))
        y_test = np.loadtxt(os.path.join(data_path, 'test/y_test.txt'), dtype=np.int64) - 1

        X_train = X_train.reshape(X_train.shape[0], -1, 1).astype(np.float32)
        X_test = X_test.reshape(X_test.shape[0], -1, 1).astype(np.float32)

        X_train, X_val, y_train, y_val = train_test_split(
            X_train, y_train, test_size=0.1, stratify=y_train, random_state=42
        )

        return {
            'X_train': X_train, 'y_train': y_train,
            'X_val': X_val, 'y_val': y_val,
            'X_test': X_test, 'y_test': y_test,
            'classes': HAR_ACTIVITIES,
            'class_names': HAR_ACTIVITIES,
            'n_classes': 6,
            'sample_length': X_train.shape[1]
        }
    except Exception as e:
        print(f"[HAR] Failed to load real dataset: {e}. Falling back to synthetic.")
        return None


def partition_har_for_federated(dataset, n_clients=5, iid=True):
    """Partition HAR data for federated simulation"""
    X_train = dataset['X_train']
    y_train = dataset['y_train']
    n_samples = len(X_train)
    client_data = []

    if iid:
        indices = np.random.permutation(n_samples)
        splits = np.array_split(indices, n_clients)
        for split in splits:
            client_data.append({
                'X': X_train[split],
                'y': y_train[split],
                'n_samples': len(split)
            })
    else:
        n_classes = dataset['n_classes']
        for i in range(n_clients):
            dominant_classes = [(i % n_classes), ((i + 1) % n_classes)]
            dominant_idx = np.where(np.isin(y_train, dominant_classes))[0]
            other_idx = np.where(~np.isin(y_train, dominant_classes))[0]

            n_dominant = min(int(0.7 * n_samples // n_clients), len(dominant_idx))
            n_other = min(int(0.3 * n_samples // n_clients), len(other_idx))

            if len(dominant_idx) > 0 and len(other_idx) > 0:
                chosen = np.concatenate([
                    np.random.choice(dominant_idx, min(n_dominant, len(dominant_idx)), replace=False),
                    np.random.choice(other_idx, min(n_other, len(other_idx)), replace=False)
                ])
            elif len(dominant_idx) > 0:
                chosen = np.random.choice(dominant_idx, min(n_dominant, len(dominant_idx)), replace=False)
            else:
                chosen = np.random.choice(other_idx, min(n_other, len(other_idx)), replace=False)

            np.random.shuffle(chosen)
            client_data.append({
                'X': X_train[chosen],
                'y': y_train[chosen],
                'n_samples': len(chosen),
                'dominant_classes': dominant_classes
            })

    return client_data
