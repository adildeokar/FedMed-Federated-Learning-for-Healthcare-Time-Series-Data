"""
ECG Data Loader - MIT-BIH Arrhythmia Dataset
Supports real wfdb loading OR synthetic ECG generation for demo
"""

import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import os

ECG_CLASSES = ['Normal (N)', 'Supraventricular (S)', 'Ventricular (V)', 'Fusion (F)', 'Unknown (Q)']
ECG_CLASS_LABELS = ['N', 'S', 'V', 'F', 'Q']
SAMPLE_LENGTH = 187


def generate_synthetic_ecg_dataset(n_samples=5000, n_classes=5, random_state=42):
    """
    Generate synthetic ECG-like data with realistic characteristics per class.
    Each class has distinctive morphological features.
    """
    np.random.seed(random_state)
    X = []
    y = []

    samples_per_class = n_samples // n_classes
    t = np.linspace(0, 1, SAMPLE_LENGTH)

    for cls in range(n_classes):
        for _ in range(samples_per_class):
            beat = np.zeros(SAMPLE_LENGTH)

            if cls == 0:  # Normal - clean PQRST
                beat += 0.1 * np.sin(2 * np.pi * 1 * t)
                beat += 1.5 * np.exp(-((t - 0.35) ** 2) / 0.002)
                beat -= 0.3 * np.exp(-((t - 0.32) ** 2) / 0.001)
                beat -= 0.2 * np.exp(-((t - 0.38) ** 2) / 0.001)
                beat += 0.3 * np.sin(2 * np.pi * 2 * (t - 0.5)) * (t > 0.5) * (t < 0.7)

            elif cls == 1:  # Supraventricular - early beat, normal QRS
                beat += 1.2 * np.exp(-((t - 0.25) ** 2) / 0.002)
                beat -= 0.2 * np.exp(-((t - 0.22) ** 2) / 0.001)
                beat -= 0.15 * np.exp(-((t - 0.28) ** 2) / 0.001)
                beat += 0.25 * np.sin(2 * np.pi * 2 * (t - 0.4)) * (t > 0.4) * (t < 0.6)

            elif cls == 2:  # Ventricular - wide QRS, no clear P
                beat += 2.0 * np.exp(-((t - 0.4) ** 2) / 0.008)
                beat -= 0.8 * np.exp(-((t - 0.35) ** 2) / 0.004)
                beat -= 0.6 * np.exp(-((t - 0.45) ** 2) / 0.004)
                beat -= 0.4 * np.sin(2 * np.pi * 1.5 * (t - 0.55)) * (t > 0.55) * (t < 0.8)

            elif cls == 3:  # Fusion - combination
                beat += 0.8 * np.exp(-((t - 0.35) ** 2) / 0.003)
                beat += 0.6 * np.exp(-((t - 0.42) ** 2) / 0.005)
                beat -= 0.3 * np.exp(-((t - 0.3) ** 2) / 0.002)

            else:  # Unknown - irregular
                beat += np.random.choice([0.5, 1.0, 1.5]) * np.exp(
                    -((t - np.random.uniform(0.2, 0.6)) ** 2) / 0.003
                )
                beat += 0.3 * np.random.randn(SAMPLE_LENGTH) * 0.1

            beat += np.random.randn(SAMPLE_LENGTH) * 0.05
            X.append(beat)
            y.append(cls)

    X = np.array(X, dtype=np.float32)
    y = np.array(y, dtype=np.int64)

    idx = np.random.permutation(len(X))
    return X[idx], y[idx]


def load_real_mitbih(data_path):
    """Load real MIT-BIH dataset from pre-processed CSV files"""
    try:
        import pandas as pd
        train_df = pd.read_csv(os.path.join(data_path, 'mitbih_train.csv'), header=None)
        test_df = pd.read_csv(os.path.join(data_path, 'mitbih_test.csv'), header=None)

        X_train = train_df.iloc[:, :-1].values.astype(np.float32)
        y_train = train_df.iloc[:, -1].values.astype(np.int64)
        X_test = test_df.iloc[:, :-1].values.astype(np.float32)
        y_test = test_df.iloc[:, -1].values.astype(np.int64)

        X_train, X_val, y_train, y_val = train_test_split(
            X_train, y_train, test_size=0.1, stratify=y_train, random_state=42
        )

        return {
            'X_train': X_train, 'y_train': y_train,
            'X_val': X_val, 'y_val': y_val,
            'X_test': X_test, 'y_test': y_test,
            'classes': ECG_CLASS_LABELS,
            'class_names': ECG_CLASSES,
            'n_classes': 5,
            'sample_length': SAMPLE_LENGTH
        }
    except Exception as e:
        print(f"[ECG] Failed to load real dataset: {e}. Falling back to synthetic.")
        return None


def load_ecg_dataset(use_real=False, data_path='data/mitbih'):
    """Load ECG dataset - real or synthetic"""
    if use_real and os.path.exists(data_path):
        result = load_real_mitbih(data_path)
        if result is not None:
            return result

    print("[ECG] Using synthetic ECG dataset (demo mode)")
    X, y = generate_synthetic_ecg_dataset(n_samples=6000)
    return split_and_scale(X, y)


def split_and_scale(X, y, test_size=0.2, val_size=0.1):
    """Split into train/val/test and normalize"""
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=test_size, stratify=y, random_state=42
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_train, y_train, test_size=val_size / (1 - test_size), stratify=y_train, random_state=42
    )

    return {
        'X_train': X_train, 'y_train': y_train,
        'X_val': X_val, 'y_val': y_val,
        'X_test': X_test, 'y_test': y_test,
        'scaler': scaler,
        'classes': ECG_CLASS_LABELS,
        'class_names': ECG_CLASSES,
        'n_classes': 5,
        'sample_length': SAMPLE_LENGTH
    }


def partition_for_federated(dataset, n_clients=5, iid=True):
    """
    Partition dataset across n_clients for federated simulation.
    iid=True: uniform random split
    iid=False: non-IID (each client gets mostly 1-2 classes — realistic wearable scenario)
    """
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

            chosen = np.concatenate([
                np.random.choice(dominant_idx, n_dominant, replace=False),
                np.random.choice(other_idx, n_other, replace=False)
            ])
            np.random.shuffle(chosen)
            client_data.append({
                'X': X_train[chosen],
                'y': y_train[chosen],
                'n_samples': len(chosen),
                'dominant_classes': dominant_classes
            })

    return client_data


def get_sample_signals(dataset, n_per_class=3):
    """Get sample signals for each class for visualization"""
    samples = {}
    for cls_idx, cls_label in enumerate(ECG_CLASS_LABELS):
        indices = np.where(dataset['y_train'] == cls_idx)[0][:n_per_class]
        samples[cls_label] = dataset['X_train'][indices].tolist()
    return samples
