# 🧠 CURSOR PROMPT: FedMed — Federated Learning for Healthcare Time-Series Data
## Complete Full-Stack Application (Major Project 2 + Mini Project 3)

---

> **Model**: Claude Sonnet 4.5 (claude-sonnet-4-20250514)  
> **Stack**: React + TypeScript + Vite (Frontend) | Python FastAPI (Backend) | Flower (FL Framework)  
> **Datasets**: MIT-BIH Arrhythmia ECG + Human Activity Recognition (UCI HAR)

---

## OVERVIEW

Build **FedMed** — a production-grade, full-stack web application that demonstrates:
1. **Mini Project 3**: Federated Learning simulation for wearable healthcare data (ECG classification) using Flower framework across simulated client nodes
2. **Major Project 2**: Complete federated ECG/wearable sensor classification system with performance comparison between centralized, distributed, and federated training

The application must be a **live interactive dashboard** with real ML training happening in the backend, visualized in real-time on the frontend. This is a demonstration/research platform, not just static charts.

---

## TECH STACK (EXACT)

### Frontend
```
- React 18 + TypeScript + Vite
- Tailwind CSS + custom CSS for animations
- Framer Motion for animations
- Recharts for data visualization
- Socket.IO client for real-time updates
- React Router v6
- Zustand for state management
- React Query (TanStack Query) for API calls
- Lucide React for icons
- shadcn/ui components as base
```

### Backend
```
- Python 3.10+
- FastAPI (main API server)
- Uvicorn (ASGI server)
- Flower (flwr) — Federated Learning framework
- PyTorch — Deep learning models
- scikit-learn — Preprocessing + metrics
- numpy, pandas — Data handling
- WebSockets (via FastAPI) — Real-time training updates
- wfdb — ECG data reading (MIT-BIH)
- scipy — Signal processing
```

### Data
```
- MIT-BIH Arrhythmia ECG dataset (via wfdb / PhysioNet)
- UCI HAR Dataset (Human Activity Recognition) - wearable sensors
- Both datasets preprocessed and stored locally as numpy arrays
```

---

## BACKEND ARCHITECTURE (build this completely)

### Directory Structure
```
backend/
├── main.py                    # FastAPI app entry point
├── requirements.txt
├── config.py                  # All configuration constants
├── data/
│   ├── __init__.py
│   ├── ecg_loader.py          # MIT-BIH ECG data loading + preprocessing
│   ├── har_loader.py          # UCI HAR data loading + preprocessing
│   └── dataset_manager.py     # Unified dataset interface
├── models/
│   ├── __init__.py
│   ├── cnn_ecg.py             # CNN model for ECG classification
│   ├── lstm_ecg.py            # LSTM model for ECG
│   ├── cnn_har.py             # CNN model for HAR wearable data
│   └── model_factory.py       # Model selection factory
├── training/
│   ├── __init__.py
│   ├── centralized.py         # Standard centralized training
│   ├── distributed.py         # Simulated distributed training
│   └── federated.py           # Flower federated learning
├── flower/
│   ├── __init__.py
│   ├── client.py              # Flower client implementation
│   ├── server.py              # Flower server + strategy
│   └── simulation.py          # Multi-client simulation orchestrator
├── api/
│   ├── __init__.py
│   ├── routes/
│   │   ├── training.py        # Training endpoints
│   │   ├── datasets.py        # Dataset preview endpoints
│   │   ├── models.py          # Model management endpoints
│   │   └── metrics.py         # Metrics and comparison endpoints
│   └── websocket.py           # WebSocket manager for real-time updates
└── utils/
    ├── __init__.py
    ├── metrics.py             # Accuracy, F1, AUC calculation
    ├── signal_processing.py   # ECG/EEG signal utilities
    └── visualization_data.py  # Data formatters for frontend
```

---

## BACKEND IMPLEMENTATION DETAILS

### 1. ECG Data Loader (`data/ecg_loader.py`)

Since MIT-BIH requires wfdb, implement a **fallback synthetic ECG generator** if the dataset isn't downloaded, so the app always works in demo mode:

```python
"""
ECG Data Loader - MIT-BIH Arrhythmia Dataset
Supports real wfdb loading OR synthetic ECG generation for demo
"""

import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import os

# MIT-BIH Classes: N=Normal, S=Supraventricular, V=Ventricular, F=Fusion, Q=Unknown
ECG_CLASSES = ['Normal (N)', 'Supraventricular (S)', 'Ventricular (V)', 'Fusion (F)', 'Unknown (Q)']
ECG_CLASS_LABELS = ['N', 'S', 'V', 'F', 'Q']

SAMPLE_LENGTH = 187  # Standard ECG beat length

def generate_synthetic_ecg_dataset(n_samples=5000, n_classes=5, random_state=42):
    """
    Generate synthetic ECG-like data with realistic characteristics per class.
    Used when real MIT-BIH dataset is not available.
    Each class has distinctive morphological features.
    """
    np.random.seed(random_state)
    X = []
    y = []
    
    samples_per_class = n_samples // n_classes
    t = np.linspace(0, 1, SAMPLE_LENGTH)
    
    for cls in range(n_classes):
        for _ in range(samples_per_class):
            # Base signal
            beat = np.zeros(SAMPLE_LENGTH)
            
            if cls == 0:  # Normal - clean PQRST
                beat += 0.1 * np.sin(2 * np.pi * 1 * t)  # P wave
                beat += 1.5 * np.exp(-((t - 0.35) ** 2) / 0.002)  # R peak
                beat -= 0.3 * np.exp(-((t - 0.32) ** 2) / 0.001)  # Q
                beat -= 0.2 * np.exp(-((t - 0.38) ** 2) / 0.001)  # S
                beat += 0.3 * np.sin(2 * np.pi * 2 * (t - 0.5)) * (t > 0.5) * (t < 0.7)  # T wave
                
            elif cls == 1:  # Supraventricular - early beat, normal QRS
                beat += 1.2 * np.exp(-((t - 0.25) ** 2) / 0.002)  # Early R
                beat -= 0.2 * np.exp(-((t - 0.22) ** 2) / 0.001)
                beat -= 0.15 * np.exp(-((t - 0.28) ** 2) / 0.001)
                beat += 0.25 * np.sin(2 * np.pi * 2 * (t - 0.4)) * (t > 0.4) * (t < 0.6)
                
            elif cls == 2:  # Ventricular - wide QRS, no clear P
                beat += 2.0 * np.exp(-((t - 0.4) ** 2) / 0.008)  # Wide R
                beat -= 0.8 * np.exp(-((t - 0.35) ** 2) / 0.004)  # Deep Q
                beat -= 0.6 * np.exp(-((t - 0.45) ** 2) / 0.004)  # Deep S
                beat -= 0.4 * np.sin(2 * np.pi * 1.5 * (t - 0.55)) * (t > 0.55) * (t < 0.8)  # Inverted T
                
            elif cls == 3:  # Fusion - combination
                beat += 0.8 * np.exp(-((t - 0.35) ** 2) / 0.003)
                beat += 0.6 * np.exp(-((t - 0.42) ** 2) / 0.005)
                beat -= 0.3 * np.exp(-((t - 0.3) ** 2) / 0.002)
                
            else:  # Unknown - irregular
                beat += np.random.choice([0.5, 1.0, 1.5]) * np.exp(-((t - np.random.uniform(0.2, 0.6)) ** 2) / 0.003)
                beat += 0.3 * np.random.randn(SAMPLE_LENGTH) * 0.1
            
            # Add noise
            beat += np.random.randn(SAMPLE_LENGTH) * 0.05
            X.append(beat)
            y.append(cls)
    
    X = np.array(X, dtype=np.float32)
    y = np.array(y, dtype=np.int64)
    
    # Shuffle
    idx = np.random.permutation(len(X))
    return X[idx], y[idx]


def load_ecg_dataset(use_real=False, data_path='data/mitbih'):
    """Load ECG dataset - real or synthetic"""
    if use_real and os.path.exists(data_path):
        return load_real_mitbih(data_path)
    else:
        print("[ECG] Using synthetic ECG dataset (demo mode)")
        X, y = generate_synthetic_ecg_dataset(n_samples=6000)
        return split_and_scale(X, y)


def split_and_scale(X, y, test_size=0.2, val_size=0.1):
    """Split into train/val/test and normalize"""
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=test_size, stratify=y, random_state=42)
    X_train, X_val, y_train, y_val = train_test_split(X_train, y_train, test_size=val_size/(1-test_size), stratify=y_train, random_state=42)
    
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
        # Non-IID: each client gets 70% of 1-2 dominant classes
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
```

### 2. HAR Data Loader (`data/har_loader.py`)

```python
"""
HAR (Human Activity Recognition) Dataset Loader
UCI HAR Dataset — wearable accelerometer/gyroscope data
6 activities: Walking, Walking Upstairs, Walking Downstairs, Sitting, Standing, Laying
"""

import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
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
        0: {'freq': 1.8, 'amp': 0.8, 'noise': 0.1},   # Walking - rhythmic
        1: {'freq': 1.5, 'amp': 1.0, 'noise': 0.15},   # Walking upstairs - higher effort
        2: {'freq': 2.0, 'amp': 0.9, 'noise': 0.12},   # Walking downstairs
        3: {'freq': 0.1, 'amp': 0.05, 'noise': 0.02},  # Sitting - nearly static
        4: {'freq': 0.05, 'amp': 0.03, 'noise': 0.01}, # Standing - very static
        5: {'freq': 0.02, 'amp': 0.02, 'noise': 0.008} # Laying - minimal motion
    }
    
    for cls in range(6):
        params = activity_params[cls]
        for _ in range(samples_per_class):
            features = []
            for f in range(HAR_N_FEATURES):
                phase = np.random.uniform(0, 2 * np.pi)
                channel = (params['amp'] * np.sin(2 * np.pi * params['freq'] * t + phase) +
                          params['noise'] * np.random.randn(HAR_SEQUENCE_LENGTH))
                features.append(channel)
            X.append(np.array(features).T)  # Shape: (128, 9)
            y.append(cls)
    
    X = np.array(X, dtype=np.float32)
    y = np.array(y, dtype=np.int64)
    idx = np.random.permutation(len(X))
    return X[idx], y[idx]


def load_har_dataset(use_real=False, data_path='data/uci_har'):
    """Load HAR dataset"""
    if use_real and os.path.exists(data_path):
        return load_real_har(data_path)
    print("[HAR] Using synthetic wearable sensor dataset (demo mode)")
    X, y = generate_synthetic_har_dataset()
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    X_train, X_val, y_train, y_val = train_test_split(X_train, y_train, test_size=0.1, stratify=y_train, random_state=42)
    
    return {
        'X_train': X_train, 'y_train': y_train,
        'X_val': X_val, 'y_val': y_val,
        'X_test': X_test, 'y_test': y_test,
        'classes': HAR_ACTIVITIES,
        'n_classes': 6,
        'sequence_length': HAR_SEQUENCE_LENGTH,
        'n_features': HAR_N_FEATURES
    }
```

### 3. CNN Model for ECG (`models/cnn_ecg.py`)

```python
"""
CNN-based ECG Classifier — 1D Convolutional Neural Network
Architecture: Conv1D → BatchNorm → ReLU → Dropout → Fully Connected
"""
import torch
import torch.nn as nn
import torch.nn.functional as F

class ECGClassifier(nn.Module):
    """
    1D CNN for ECG beat classification.
    Input: (batch, 1, 187) — single-channel ECG segment
    Output: (batch, 5) — class probabilities
    """
    def __init__(self, n_classes=5, input_length=187):
        super(ECGClassifier, self).__init__()
        
        # Convolutional blocks
        self.conv1 = nn.Conv1d(1, 32, kernel_size=5, padding=2)
        self.bn1 = nn.BatchNorm1d(32)
        self.conv2 = nn.Conv1d(32, 64, kernel_size=5, padding=2)
        self.bn2 = nn.BatchNorm1d(64)
        self.conv3 = nn.Conv1d(64, 128, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm1d(128)
        self.conv4 = nn.Conv1d(128, 256, kernel_size=3, padding=1)
        self.bn4 = nn.BatchNorm1d(256)
        
        self.pool = nn.MaxPool1d(2)
        self.dropout = nn.Dropout(0.3)
        self.global_pool = nn.AdaptiveAvgPool1d(1)
        
        # FC layers
        self.fc1 = nn.Linear(256, 128)
        self.fc2 = nn.Linear(128, 64)
        self.fc3 = nn.Linear(64, n_classes)
        
    def forward(self, x):
        # x shape: (batch, 1, length)
        x = self.dropout(self.pool(F.relu(self.bn1(self.conv1(x)))))
        x = self.dropout(self.pool(F.relu(self.bn2(self.conv2(x)))))
        x = self.dropout(self.pool(F.relu(self.bn3(self.conv3(x)))))
        x = F.relu(self.bn4(self.conv4(x)))
        x = self.global_pool(x).squeeze(-1)
        x = F.relu(self.fc1(x))
        x = self.dropout(F.relu(self.fc2(x)))
        return self.fc3(x)
    
    def get_num_parameters(self):
        return sum(p.numel() for p in self.parameters() if p.requires_grad)


class LSTMECGClassifier(nn.Module):
    """
    Bidirectional LSTM for ECG classification
    """
    def __init__(self, n_classes=5, input_size=1, hidden_size=64, num_layers=2):
        super(LSTMECGClassifier, self).__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers=num_layers,
                           batch_first=True, bidirectional=True, dropout=0.3)
        self.attention = nn.Linear(hidden_size * 2, 1)
        self.fc1 = nn.Linear(hidden_size * 2, 64)
        self.fc2 = nn.Linear(64, n_classes)
        self.dropout = nn.Dropout(0.3)
        
    def forward(self, x):
        # x: (batch, 1, length) → (batch, length, 1)
        x = x.permute(0, 2, 1)
        lstm_out, _ = self.lstm(x)
        
        # Attention
        attn_weights = torch.softmax(self.attention(lstm_out), dim=1)
        context = (lstm_out * attn_weights).sum(dim=1)
        
        out = F.relu(self.fc1(context))
        out = self.dropout(out)
        return self.fc2(out)
```

### 4. Flower Federated Learning (`flower/client.py`, `flower/server.py`, `flower/simulation.py`)

```python
# flower/client.py
"""
Flower Federated Learning Client
Each client = simulated wearable device with local ECG/HAR data
"""
import flwr as fl
import torch
import torch.nn as nn
import numpy as np
from torch.utils.data import DataLoader, TensorDataset
from typing import Dict, List, Tuple
from collections import OrderedDict

class FederatedClient(fl.client.NumPyClient):
    def __init__(self, client_id: int, model, X_train, y_train, X_val, y_val,
                 device='cpu', learning_rate=0.001):
        self.client_id = client_id
        self.model = model.to(device)
        self.device = device
        self.lr = learning_rate
        
        # Create DataLoaders
        X_t = torch.FloatTensor(X_train).unsqueeze(1)
        y_t = torch.LongTensor(y_train)
        X_v = torch.FloatTensor(X_val).unsqueeze(1)
        y_v = torch.LongTensor(y_val)
        
        self.train_loader = DataLoader(TensorDataset(X_t, y_t), batch_size=32, shuffle=True)
        self.val_loader = DataLoader(TensorDataset(X_v, y_v), batch_size=64)
        
        self.criterion = nn.CrossEntropyLoss()
        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=learning_rate)
        self.history = []
    
    def get_parameters(self, config):
        return [val.cpu().numpy() for _, val in self.model.state_dict().items()]
    
    def set_parameters(self, parameters):
        params_dict = zip(self.model.state_dict().keys(), parameters)
        state_dict = OrderedDict({k: torch.tensor(v) for k, v in params_dict})
        self.model.load_state_dict(state_dict, strict=True)
    
    def fit(self, parameters, config):
        self.set_parameters(parameters)
        epochs = config.get('local_epochs', 3)
        
        self.model.train()
        total_loss = 0.0
        
        for epoch in range(epochs):
            for X_batch, y_batch in self.train_loader:
                X_batch, y_batch = X_batch.to(self.device), y_batch.to(self.device)
                self.optimizer.zero_grad()
                output = self.model(X_batch)
                loss = self.criterion(output, y_batch)
                loss.backward()
                self.optimizer.step()
                total_loss += loss.item()
        
        avg_loss = total_loss / (len(self.train_loader) * epochs)
        return self.get_parameters(config={}), len(self.train_loader.dataset), {'loss': avg_loss, 'client_id': self.client_id}
    
    def evaluate(self, parameters, config):
        self.set_parameters(parameters)
        self.model.eval()
        
        correct = 0
        total = 0
        loss = 0.0
        
        with torch.no_grad():
            for X_batch, y_batch in self.val_loader:
                X_batch, y_batch = X_batch.to(self.device), y_batch.to(self.device)
                output = self.model(X_batch)
                loss += self.criterion(output, y_batch).item()
                pred = output.argmax(dim=1)
                correct += (pred == y_batch).sum().item()
                total += len(y_batch)
        
        accuracy = correct / total
        return loss / len(self.val_loader), total, {'accuracy': accuracy, 'client_id': self.client_id}
```

```python
# flower/simulation.py
"""
Federated Learning Simulation Orchestrator
Runs FL training, emits real-time updates via WebSocket callbacks
"""
import asyncio
import numpy as np
import torch
from typing import Callable, Optional, Dict, Any, List
import time
from sklearn.metrics import f1_score, accuracy_score, confusion_matrix
from torch.utils.data import DataLoader, TensorDataset
import torch.nn as nn
from collections import OrderedDict


class FederatedSimulator:
    """
    Manual FL simulation (without Flower server for demo flexibility).
    Implements FedAvg aggregation with real-time progress callbacks.
    """
    
    def __init__(self, model_class, dataset, n_clients=5, iid=True,
                 n_rounds=10, local_epochs=3, lr=0.001,
                 callback: Optional[Callable] = None):
        self.model_class = model_class
        self.dataset = dataset
        self.n_clients = n_clients
        self.n_rounds = n_rounds
        self.local_epochs = local_epochs
        self.lr = lr
        self.callback = callback
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Partition data
        from data.ecg_loader import partition_for_federated
        self.client_partitions = partition_for_federated(dataset, n_clients, iid)
        
        # Global model
        self.global_model = model_class().to(self.device)
        self.criterion = nn.CrossEntropyLoss()
        
        self.round_metrics = []
        self.client_metrics_history = {i: [] for i in range(n_clients)}
        self.is_running = False
    
    def _train_client(self, client_id, model_params, client_data):
        """Train a single client locally and return updated params + metrics"""
        model = self.model_class().to(self.device)
        
        # Load global params
        state_dict = OrderedDict({k: torch.tensor(v) for k, v in zip(model.state_dict().keys(), model_params)})
        model.load_state_dict(state_dict)
        
        X = torch.FloatTensor(client_data['X']).unsqueeze(1)
        y = torch.LongTensor(client_data['y'])
        loader = DataLoader(TensorDataset(X, y), batch_size=32, shuffle=True)
        
        optimizer = torch.optim.Adam(model.parameters(), lr=self.lr)
        model.train()
        
        total_loss = 0
        for _ in range(self.local_epochs):
            for X_b, y_b in loader:
                X_b, y_b = X_b.to(self.device), y_b.to(self.device)
                optimizer.zero_grad()
                out = model(X_b)
                loss = self.criterion(out, y_b)
                loss.backward()
                optimizer.step()
                total_loss += loss.item()
        
        avg_loss = total_loss / (len(loader) * self.local_epochs)
        updated_params = [val.cpu().numpy() for _, val in model.state_dict().items()]
        
        return updated_params, len(client_data['X']), avg_loss
    
    def _fedavg_aggregate(self, client_params_list, client_sizes):
        """FedAvg: weighted average of client parameters"""
        total_samples = sum(client_sizes)
        weights = [s / total_samples for s in client_sizes]
        
        aggregated = []
        for param_idx in range(len(client_params_list[0])):
            weighted_param = sum(w * params[param_idx] for w, params in zip(weights, client_params_list))
            aggregated.append(weighted_param)
        
        return aggregated
    
    def _evaluate_global(self):
        """Evaluate global model on test set"""
        X_test = torch.FloatTensor(self.dataset['X_test']).unsqueeze(1)
        y_test = torch.LongTensor(self.dataset['y_test'])
        loader = DataLoader(TensorDataset(X_test, y_test), batch_size=64)
        
        self.global_model.eval()
        all_preds = []
        all_labels = []
        total_loss = 0
        
        with torch.no_grad():
            for X_b, y_b in loader:
                X_b, y_b = X_b.to(self.device), y_b.to(self.device)
                out = self.global_model(X_b)
                total_loss += self.criterion(out, y_b).item()
                preds = out.argmax(dim=1).cpu().numpy()
                all_preds.extend(preds)
                all_labels.extend(y_b.cpu().numpy())
        
        accuracy = accuracy_score(all_labels, all_preds)
        f1 = f1_score(all_labels, all_preds, average='weighted')
        cm = confusion_matrix(all_labels, all_preds).tolist()
        avg_loss = total_loss / len(loader)
        
        return {'accuracy': accuracy, 'f1_score': f1, 'loss': avg_loss, 'confusion_matrix': cm}
    
    async def run(self):
        """Run full federated training simulation"""
        self.is_running = True
        global_params = [val.cpu().numpy() for _, val in self.global_model.state_dict().items()]
        
        for round_num in range(1, self.n_rounds + 1):
            if not self.is_running:
                break
            
            round_start = time.time()
            client_results = []
            client_sizes = []
            round_client_metrics = []
            
            # Train each client
            for client_id in range(self.n_clients):
                params, n_samples, client_loss = self._train_client(
                    client_id, global_params, self.client_partitions[client_id]
                )
                client_results.append(params)
                client_sizes.append(n_samples)
                round_client_metrics.append({
                    'client_id': client_id,
                    'n_samples': n_samples,
                    'loss': client_loss,
                    'dominant_classes': self.client_partitions[client_id].get('dominant_classes', [])
                })
                
                if self.callback:
                    await self.callback({
                        'type': 'client_update',
                        'round': round_num,
                        'client_id': client_id,
                        'loss': client_loss,
                        'n_samples': n_samples,
                        'progress': ((client_id + 1) / self.n_clients) * 100
                    })
                
                await asyncio.sleep(0.1)  # Allow UI updates
            
            # Aggregate
            global_params = self._fedavg_aggregate(client_results, client_sizes)
            
            # Update global model
            state_dict = OrderedDict({
                k: torch.tensor(v) for k, v in zip(self.global_model.state_dict().keys(), global_params)
            })
            self.global_model.load_state_dict(state_dict)
            
            # Evaluate
            metrics = self._evaluate_global()
            round_time = time.time() - round_start
            
            round_summary = {
                'round': round_num,
                'accuracy': metrics['accuracy'],
                'f1_score': metrics['f1_score'],
                'loss': metrics['loss'],
                'round_time': round_time,
                'client_metrics': round_client_metrics,
                'confusion_matrix': metrics['confusion_matrix'],
                'communication_cost': sum(p.nbytes for p in global_params) * 2 / 1024  # KB
            }
            self.round_metrics.append(round_summary)
            
            if self.callback:
                await self.callback({
                    'type': 'round_complete',
                    **round_summary
                })
            
            await asyncio.sleep(0.1)
        
        self.is_running = False
        return self.round_metrics
```

### 5. Centralized Training (`training/centralized.py`)

```python
"""
Centralized Training — Baseline for comparison
Standard PyTorch training loop with real-time progress callbacks
"""
import torch
import torch.nn as nn
import numpy as np
import time
import asyncio
from torch.utils.data import DataLoader, TensorDataset
from sklearn.metrics import f1_score, accuracy_score, confusion_matrix
from typing import Callable, Optional


class CentralizedTrainer:
    def __init__(self, model, dataset, epochs=20, lr=0.001, batch_size=64,
                 callback: Optional[Callable] = None):
        self.model = model
        self.dataset = dataset
        self.epochs = epochs
        self.lr = lr
        self.batch_size = batch_size
        self.callback = callback
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = self.model.to(self.device)
        
        X_train = torch.FloatTensor(dataset['X_train']).unsqueeze(1)
        y_train = torch.LongTensor(dataset['y_train'])
        X_val = torch.FloatTensor(dataset['X_val']).unsqueeze(1)
        y_val = torch.LongTensor(dataset['y_val'])
        X_test = torch.FloatTensor(dataset['X_test']).unsqueeze(1)
        y_test = torch.LongTensor(dataset['y_test'])
        
        self.train_loader = DataLoader(TensorDataset(X_train, y_train), batch_size=batch_size, shuffle=True)
        self.val_loader = DataLoader(TensorDataset(X_val, y_val), batch_size=batch_size * 2)
        self.test_loader = DataLoader(TensorDataset(X_test, y_test), batch_size=batch_size * 2)
        
        self.criterion = nn.CrossEntropyLoss()
        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=lr)
        self.scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(self.optimizer, patience=3)
        
        self.epoch_metrics = []
    
    async def train(self):
        start_time = time.time()
        
        for epoch in range(1, self.epochs + 1):
            self.model.train()
            epoch_loss = 0
            epoch_start = time.time()
            
            for batch_idx, (X_b, y_b) in enumerate(self.train_loader):
                X_b, y_b = X_b.to(self.device), y_b.to(self.device)
                self.optimizer.zero_grad()
                out = self.model(X_b)
                loss = self.criterion(out, y_b)
                loss.backward()
                self.optimizer.step()
                epoch_loss += loss.item()
                
                if self.callback and batch_idx % 5 == 0:
                    await self.callback({
                        'type': 'batch_update',
                        'epoch': epoch,
                        'batch': batch_idx,
                        'total_batches': len(self.train_loader),
                        'loss': loss.item(),
                        'progress': (batch_idx / len(self.train_loader)) * 100
                    })
            
            # Validate
            val_metrics = self._evaluate(self.val_loader)
            train_loss = epoch_loss / len(self.train_loader)
            self.scheduler.step(val_metrics['loss'])
            
            epoch_summary = {
                'epoch': epoch,
                'train_loss': train_loss,
                'val_loss': val_metrics['loss'],
                'val_accuracy': val_metrics['accuracy'],
                'val_f1': val_metrics['f1'],
                'epoch_time': time.time() - epoch_start,
                'elapsed': time.time() - start_time
            }
            self.epoch_metrics.append(epoch_summary)
            
            if self.callback:
                await self.callback({
                    'type': 'epoch_complete',
                    **epoch_summary
                })
            
            await asyncio.sleep(0.05)
        
        # Final test evaluation
        test_metrics = self._evaluate(self.test_loader)
        return {
            'epoch_metrics': self.epoch_metrics,
            'test_accuracy': test_metrics['accuracy'],
            'test_f1': test_metrics['f1'],
            'total_time': time.time() - start_time,
            'confusion_matrix': test_metrics['cm'].tolist()
        }
    
    def _evaluate(self, loader):
        self.model.eval()
        all_preds, all_labels = [], []
        total_loss = 0
        
        with torch.no_grad():
            for X_b, y_b in loader:
                X_b, y_b = X_b.to(self.device), y_b.to(self.device)
                out = self.model(X_b)
                total_loss += self.criterion(out, y_b).item()
                all_preds.extend(out.argmax(1).cpu().numpy())
                all_labels.extend(y_b.cpu().numpy())
        
        return {
            'accuracy': accuracy_score(all_labels, all_preds),
            'f1': f1_score(all_labels, all_preds, average='weighted'),
            'loss': total_loss / len(loader),
            'cm': confusion_matrix(all_labels, all_preds)
        }
```

### 6. FastAPI Main Server (`main.py`)

```python
"""
FedMed FastAPI Server
Real-time training dashboard backend with WebSocket support
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio
import json
import uuid
from typing import Dict, Any
import numpy as np

from api.routes import training, datasets, metrics, models_router
from api.websocket import ConnectionManager

app = FastAPI(title="FedMed API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
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
                    
    except WebSocketDisconnect:
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
            from models.cnn_har import HARClassifier
            ModelClass = HARClassifier
        
        await emit({'type': 'dataset_loaded', 'stats': {
            'train_samples': len(dataset['X_train']),
            'test_samples': len(dataset['X_test']),
            'n_classes': dataset['n_classes']
        }})
        
        if training_type == 'centralized':
            model = ModelClass()
            trainer = CentralizedTrainer(model, dataset,
                                          epochs=config.get('epochs', 15),
                                          lr=config.get('lr', 0.001),
                                          callback=emit)
            results = await trainer.train()
            
        elif training_type == 'federated':
            simulator = FederatedSimulator(
                ModelClass, dataset,
                n_clients=config.get('n_clients', 5),
                iid=config.get('iid', True),
                n_rounds=config.get('n_rounds', 10),
                local_epochs=config.get('local_epochs', 3),
                callback=emit
            )
            results = await simulator.run()
        
        elif training_type == 'distributed':
            trainer = DistributedTrainer(ModelClass, dataset,
                                          n_workers=config.get('n_workers', 3),
                                          epochs=config.get('epochs', 15),
                                          callback=emit)
            results = await trainer.train()
        
        await emit({'type': 'training_complete', 'results': results})
        
    except Exception as e:
        await emit({'type': 'error', 'message': str(e)})
    finally:
        active_jobs.pop(job_id, None)


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
```

---

## FRONTEND ARCHITECTURE (build this completely)

### Directory Structure
```
frontend/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── package.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css               # Global styles + CSS variables + animations
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── Layout.tsx
│   │   ├── charts/
│   │   │   ├── ECGWaveform.tsx          # Animated live ECG display
│   │   │   ├── TrainingCurve.tsx        # Loss/accuracy curves
│   │   │   ├── ConfusionMatrix.tsx      # Heatmap confusion matrix
│   │   │   ├── FederatedTopology.tsx    # Network graph of clients
│   │   │   ├── ComparisonRadar.tsx      # Radar chart: centralized vs distributed vs federated
│   │   │   └── ClientStatusGrid.tsx    # Grid of client nodes with live status
│   │   ├── training/
│   │   │   ├── TrainingConfig.tsx       # Config panel
│   │   │   ├── TrainingProgress.tsx     # Live training progress
│   │   │   └── MetricsPanel.tsx         # Real-time metrics display
│   │   ├── dashboard/
│   │   │   ├── StatsCard.tsx
│   │   │   ├── DatasetPreview.tsx
│   │   │   └── ModelCard.tsx
│   │   └── ui/
│   │       ├── AnimatedCounter.tsx
│   │       ├── PulseIndicator.tsx
│   │       ├── GlowButton.tsx
│   │       └── ParticleBackground.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx               # Home — overview + quick stats
│   │   ├── DataExplorer.tsx            # Dataset visualization
│   │   ├── CentralizedTraining.tsx     # Mini Project 1 demo
│   │   ├── DistributedTraining.tsx     # Mini Project 2 demo  
│   │   ├── FederatedTraining.tsx       # Mini Project 3 + Major Project 2 MAIN
│   │   ├── Comparison.tsx              # Final comparison page
│   │   └── About.tsx                   # Project info
│   ├── hooks/
│   │   ├── useWebSocket.ts
│   │   ├── useTraining.ts
│   │   └── useMetrics.ts
│   ├── store/
│   │   └── trainingStore.ts            # Zustand store
│   ├── types/
│   │   └── training.ts
│   └── utils/
│       ├── formatters.ts
│       └── colors.ts
```

---

## FRONTEND DESIGN SPECIFICATION

### Color Palette & Theme
```css
/* src/index.css — DARK FUTURISTIC MEDICAL THEME */
:root {
  /* Core background — deep navy/slate dark */
  --bg-primary: #030712;
  --bg-secondary: #0a0f1e;
  --bg-card: #0d1424;
  --bg-card-hover: #111827;
  --bg-elevated: #131c2e;
  
  /* Brand — electric cyan + medical green */
  --accent-primary: #00d4ff;     /* Electric cyan */
  --accent-secondary: #00ff88;   /* Medical green */
  --accent-warning: #ffb800;     /* Alert amber */
  --accent-danger: #ff4757;      /* Critical red */
  --accent-purple: #8b5cf6;      /* Model purple */
  
  /* Glow effects */
  --glow-cyan: 0 0 20px rgba(0, 212, 255, 0.4), 0 0 60px rgba(0, 212, 255, 0.1);
  --glow-green: 0 0 20px rgba(0, 255, 136, 0.4), 0 0 60px rgba(0, 255, 136, 0.1);
  
  /* Text */
  --text-primary: #e2e8f0;
  --text-secondary: #94a3b8;
  --text-muted: #475569;
  
  /* Borders */
  --border-subtle: rgba(0, 212, 255, 0.1);
  --border-active: rgba(0, 212, 255, 0.4);
  
  /* Chart colors */
  --chart-centralized: #3b82f6;
  --chart-distributed: #8b5cf6;
  --chart-federated: #00d4ff;
}
```

### Typography
```
Font pairings (load from Google Fonts):
- Display: "Space Mono" — monospaced, technical, medical feel
- Headings: "Rajdhani" — condensed, futuristic
- Body: "DM Sans" — clean, readable
- Data/Numbers: "JetBrains Mono" — for metrics, values, code
```

### Animations (must implement ALL of these)

1. **ECG Waveform Animation**: Animated SVG ECG wave scrolling across the hero area and dashboard
2. **Training Progress**: Animated line chart that draws itself in real-time as training epochs complete
3. **Federated Topology**: Animated network graph showing client nodes → aggregation server with pulsing data flow lines
4. **Client Status Nodes**: Each client node pulses when active, shows color gradient for training progress
5. **Metric Counters**: Numbers animate/count-up when values update
6. **Page Transitions**: Framer Motion page transitions (slide + fade)
7. **Card Hover Effects**: Glow border animation on hover with transform scale
8. **Loading States**: Skeleton loading with shimmer animation
9. **Confusion Matrix**: Heatmap cells animate in with staggered delay
10. **Particle Background**: Subtle floating particle system on the hero/header area

---

## PAGE-BY-PAGE SPECIFICATION

### Page 1: Dashboard (`/`)

**Layout**: Split into 3 sections:
- **Hero Section** (top, full width): 
  - Animated ECG waveform scrolling in background
  - Title: "FedMed" with glowing cyan text
  - Subtitle: "Federated Learning for Healthcare Time-Series Data"
  - 4 stat cards: Total Experiments, Best FL Accuracy, Communication Rounds, Active Clients
  - Each stat card has animated number counter and subtle glow border

- **Project Overview Cards** (middle, 3 columns):
  - Card 1: Mini Project 3 — Federated Learning (PRIMARY badge)
  - Card 2: Major Project 2 — Full FL System (MAIN badge)
  - Card 3: Quick Start — Launch demo training
  - Each card: hover lifts with glow, icon, description, status badge, CTA button

- **Recent Activity** (bottom):
  - Timeline of recent training runs with accuracy/F1 scores
  - Color-coded by training type (centralized/distributed/federated)

### Page 2: Data Explorer (`/data`)

**Layout**: Full-page data visualization

- **Dataset Selector**: Toggle between ECG and HAR dataset with animated switch
- **ECG Panel** (when ECG selected):
  - Sample ECG waveforms for each class (N, S, V, F, Q) displayed as animated SVG charts
  - Class distribution donut chart
  - Dataset statistics table (n_samples, split sizes, sample rate)
  - Signal characteristics: amplitude histogram, frequency spectrum

- **HAR Panel** (when HAR selected):
  - 6 activity waveforms (accelerometer/gyroscope channels)
  - Activity duration bar chart
  - Sensor channel correlation heatmap

- **Federated Partition Visualization**:
  - Show how data is split across 5 clients (IID vs non-IID toggle)
  - Stacked bar chart: each client's class distribution
  - Visual callout showing privacy preservation (no data leaves client)

### Page 3: Federated Training — MAIN PAGE (`/federated`)

This is the most important page — the full demo of Mini Project 3 + Major Project 2.

**Layout**: 3-panel dashboard

**Left Panel — Configuration (25% width)**:
```
┌─────────────────────────────┐
│  TRAINING CONFIGURATION     │
│  ─────────────────────────  │
│  Dataset: [ECG ▼]           │
│  Model:   [CNN  ▼]          │
│  Clients: [5] (slider 2-10) │
│  Rounds:  [10] (slider 5-20)│
│  Local Epochs: [3]          │
│  Data Distribution:         │
│    ● IID  ○ Non-IID         │
│  Learning Rate: 0.001       │
│  Aggregation: FedAvg        │
│                             │
│  [▶ START FEDERATED]        │
│  [■ STOP]                   │
│                             │
│  Privacy Features:          │
│  ✓ No raw data sharing      │
│  ✓ FedAvg aggregation       │
│  ✓ Local training only      │
└─────────────────────────────┘
```

**Center Panel — Live Visualization (50% width)**:
- **Federated Topology Diagram**: Animated D3/SVG network showing:
  - Central server node (glowing, pulsing)
  - 5 client nodes arranged in a circle
  - Animated lines showing: model → clients (blue), gradients → server (cyan)
  - Each line pulses during active communication
  - Client nodes show: training progress bar, sample count, current loss
  - Node color changes: idle (gray) → training (amber) → sending (cyan) → done (green)

- **Live Training Log**: Scrolling console-style log with timestamps showing:
  ```
  [Round 3/10] ─────────────────────
  [Client 0] Training... loss: 0.342
  [Client 1] Training... loss: 0.318
  [Client 2] Training... loss: 0.291
  [Client 3] Training... loss: 0.367
  [Client 4] Training... loss: 0.305
  [Aggregation] FedAvg → Global model
  [Evaluation] Accuracy: 87.3% | F1: 0.866
  ```

**Right Panel — Metrics (25% width)**:
- Round-by-round accuracy chart (animated line building in real-time)
- Communication overhead gauge
- Current best metrics cards (Accuracy, F1, Loss)
- Client participation indicator (all 5 green when all participated)

**Bottom Section — Full Width**:
- Tabbed confusion matrix for current round
- Per-class F1 scores bar chart
- Communication rounds vs accuracy convergence curve

### Page 4: Centralized Training (`/centralized`)

**Purpose**: Mini Project 1 baseline

- Same config panel (dataset, model, epochs, LR)
- Live loss + accuracy curves animating epoch by epoch
- Training vs validation curves with legend
- Final metrics display
- Epoch speed counter (samples/sec)
- Model architecture diagram (simple SVG block diagram)

### Page 5: Distributed Training (`/distributed`)

**Purpose**: Mini Project 2 demo

- Worker count slider (2-4 workers)
- Simulated data parallelism visualization:
  - Show data being split across workers
  - Each worker's GPU utilization bar (simulated)
  - Gradient synchronization animation
- Training curves with speedup metrics
- Memory usage chart

### Page 6: Comparison (`/comparison`)

**The final results page — comparing all 3 approaches**

**Top Section**: Summary table
```
┌──────────────┬────────────┬──────────────┬───────────────┐
│ Metric       │ Centralized│ Distributed  │ Federated     │
├──────────────┼────────────┼──────────────┼───────────────┤
│ Accuracy     │   91.2%    │    89.8%     │    87.3%      │
│ F1 Score     │   0.908    │    0.891     │    0.866      │
│ Training Time│   45s      │    28s       │    120s       │
│ Privacy      │    ✗       │     ✗        │     ✓         │
│ Scalability  │    ✗       │     ✓        │     ✓         │
│ Data Sharing │  Full      │   Full       │   None        │
└──────────────┴────────────┴──────────────┴───────────────┘
```

**Charts Section**:
1. **Radar Chart**: Multi-dimensional comparison (accuracy, speed, privacy, scalability, efficiency)
2. **Bar Chart**: Accuracy + F1 side-by-side for all 3 methods
3. **Line Chart**: Training convergence curves overlaid for all 3 methods
4. **Scatter Plot**: Communication cost vs accuracy trade-off

**Insight Cards**: 3 cards with key findings:
- "Federated learning achieves 87.3% accuracy while ensuring complete data privacy"
- "Distributed training reduces training time by 38% vs centralized"
- "FedAvg converges in 10 rounds with 5 simulated wearable clients"

---

## CRITICAL IMPLEMENTATION REQUIREMENTS

### WebSocket Real-Time Updates
The frontend must connect to the backend WebSocket and handle ALL message types:

```typescript
// src/hooks/useWebSocket.ts
type TrainingMessage = 
  | { type: 'batch_update'; epoch: number; batch: number; loss: number; progress: number }
  | { type: 'epoch_complete'; epoch: number; train_loss: number; val_accuracy: number; val_f1: number }
  | { type: 'client_update'; round: number; client_id: number; loss: number; n_samples: number }
  | { type: 'round_complete'; round: number; accuracy: number; f1_score: number; loss: number; confusion_matrix: number[][] }
  | { type: 'training_complete'; results: any }
  | { type: 'error'; message: string }
  | { type: 'loading'; message: string }
```

### Zustand Store Structure
```typescript
// src/store/trainingStore.ts
interface TrainingStore {
  // Active job
  activeJobId: string | null
  isTraining: boolean
  trainingType: 'centralized' | 'distributed' | 'federated' | null
  
  // Real-time metrics
  currentEpoch: number
  currentRound: number
  currentLoss: number
  currentAccuracy: number
  currentF1: number
  
  // History
  epochHistory: EpochMetric[]
  roundHistory: RoundMetric[]
  clientHistory: Record<number, ClientMetric[]>
  
  // Client states for federated topology
  clientStates: Record<number, 'idle' | 'training' | 'sending' | 'done'>
  
  // Final results
  centralizedResults: TrainingResults | null
  distributedResults: TrainingResults | null
  federatedResults: TrainingResults | null
  
  // Actions
  startTraining: (config: TrainingConfig) => void
  stopTraining: () => void
  resetStore: () => void
  handleWebSocketMessage: (msg: TrainingMessage) => void
}
```

### Animated ECG Component
```typescript
// src/components/charts/ECGWaveform.tsx
// Renders a scrolling ECG waveform using SVG + CSS animation
// - Uses a repeating path that shifts left continuously
// - Different colors/morphologies per class
// - Used in: Dashboard hero, DataExplorer, training progress visual
```

### Federated Topology Component
```typescript
// src/components/charts/FederatedTopology.tsx
// Pure SVG/CSS animated topology diagram
// - Server node center with radiating glow
// - N client nodes in a circle
// - Animated dashed lines (stroke-dashoffset animation) flowing between clients and server
// - Line direction changes based on training phase (push weights vs pull gradients)
// - Client node badges show: "C0", "C1", etc. with status color
// - MUST use Framer Motion for the node state transitions
```

---

## DEPENDENCIES (requirements.txt for backend)

```
fastapi==0.109.0
uvicorn[standard]==0.27.0
websockets==12.0
flwr==1.7.0
torch==2.1.0
torchvision==0.16.0
scikit-learn==1.4.0
numpy==1.26.0
pandas==2.1.4
scipy==1.12.0
wfdb==4.1.2
python-multipart==0.0.6
pydantic==2.5.3
```

```json
// package.json frontend dependencies
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "framer-motion": "^10.16.16",
    "recharts": "^2.10.3",
    "zustand": "^4.4.7",
    "@tanstack/react-query": "^5.17.0",
    "lucide-react": "^0.312.0",
    "socket.io-client": "^4.6.2",
    "d3": "^7.8.5",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "typescript": "^5.2.2",
    "vite": "^5.0.8",
    "@vitejs/plugin-react": "^4.2.1",
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.33",
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@types/d3": "^7.4.3"
  }
}
```

---

## ADDITIONAL FEATURES TO IMPLEMENT

### 1. Signal Preview Panel
On the federated training page, show a small preview of actual ECG/HAR signals from the dataset (the synthetic ones) using Recharts LineChart. This makes the app feel grounded in real data.

### 2. Privacy Score Indicator
A visual "Privacy Score" meter (0-100) that updates based on training type:
- Centralized: 0 (all data centralized)  
- Distributed: 20 (data shared across nodes)
- Federated: 95 (only model weights shared)

### 3. Export Results Button
A button that generates a JSON export of the training run results. This can be used for the project report.

### 4. Training Presets
3 preset buttons for quick demo:
- "Quick Demo" (5 rounds, 3 clients)
- "Standard" (10 rounds, 5 clients)
- "Full Experiment" (20 rounds, 10 clients)

### 5. Model Architecture Visualizer
A simple SVG block diagram on the centralized/federated pages showing:
- For CNN: Conv1D → BN → ReLU → Pool → ... → FC → Softmax
- For LSTM: Embedding → BiLSTM → Attention → FC → Softmax

### 6. Live Accuracy Gauge
A circular gauge/speedometer component that shows current accuracy with animated needle, color gradient (red → yellow → green), target accuracy line.

### 7. Communication Round Timeline
For the federated training page, a horizontal timeline showing each round as a milestone. Current round has a pulsing indicator. Completed rounds show accuracy achieved.

---

## README.md (create this)

```markdown
# FedMed — Federated Learning for Healthcare Time-Series Data

## Project Overview
FedMed is a full-stack research platform demonstrating federated learning applied to healthcare 
ECG and wearable sensor data classification.

## Projects Demonstrated
- **Mini Project 3**: Federated Learning for Wearable Healthcare Data using Flower framework
- **Major Project 2**: Complete FL system with centralized/distributed/federated comparison

## Datasets
- **ECG**: MIT-BIH Arrhythmia (synthetic demo mode if not downloaded)
- **HAR**: UCI Human Activity Recognition wearable sensor data

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Key Features
- Real-time federated learning simulation with live progress
- Animated federated topology visualization
- Side-by-side comparison: centralized vs distributed vs federated
- Privacy-preserving training with FedAvg aggregation
- Interactive ECG/HAR signal explorer
- Live confusion matrix and per-class metrics

## Architecture
The system simulates 5 wearable device clients locally training ECG classifiers, 
aggregating via FedAvg without raw data leaving each device.
```

---

## FINAL CHECKLIST

Build ALL of the following:

**Backend**:
- [ ] `main.py` — FastAPI server with WebSocket
- [ ] `data/ecg_loader.py` — ECG data with synthetic fallback
- [ ] `data/har_loader.py` — HAR wearable data
- [ ] `models/cnn_ecg.py` — CNN + LSTM models
- [ ] `models/cnn_har.py` — CNN for HAR
- [ ] `training/centralized.py` — Centralized trainer with callbacks
- [ ] `training/distributed.py` — Simulated distributed trainer
- [ ] `flower/simulation.py` — Full FL simulation with FedAvg
- [ ] `api/routes/training.py` — REST endpoints
- [ ] `api/websocket.py` — WebSocket connection manager
- [ ] `requirements.txt`

**Frontend**:
- [ ] All 6 pages fully implemented
- [ ] Federated topology animated diagram
- [ ] ECG waveform animation component
- [ ] Real-time training curves (Recharts)
- [ ] Confusion matrix heatmap
- [ ] Radar comparison chart
- [ ] WebSocket hook + Zustand store
- [ ] Dark futuristic medical theme (cyan + green on dark)
- [ ] Framer Motion page transitions
- [ ] Client status grid with pulse animations
- [ ] Animated metric counters
- [ ] Mobile-responsive layout
- [ ] `package.json` + `vite.config.ts` + `tailwind.config.js`

**Documentation**:
- [ ] `README.md`
- [ ] Inline code comments for all major functions

---

## IMPORTANT NOTES FOR CURSOR

1. **DO NOT use Flower's built-in simulation** — implement the FedAvg loop manually in `flower/simulation.py` for better WebSocket callback integration

2. **The synthetic data generators MUST produce realistic-looking signals** — use sinusoidal functions with class-specific characteristics, not just random noise

3. **WebSocket messages MUST be sent frequently** — every batch during centralized, every client during federated rounds, so the UI feels live

4. **The Federated Topology SVG MUST animate** — use `stroke-dashoffset` CSS animation for the flowing lines, and Framer Motion for node state transitions. This is the visual centerpiece.

5. **ALL charts use Recharts** — do not use Chart.js or D3 directly for charts (D3 can be used for the topology SVG only)

6. **Colors**: Strictly follow the CSS variable system. Never hardcode colors. Use `var(--accent-primary)` etc.

7. **Start the backend server on port 8000**, frontend on port 5173

8. **The comparison page MUST work even without running actual training** — load mock/default results if no training has been run yet, so the demo always looks complete

9. **Handle WebSocket disconnection gracefully** — show a reconnecting indicator if the backend is not running

10. **Make the app feel like a REAL research tool** — professional, polished, with legitimate ML terminology used correctly throughout
```
