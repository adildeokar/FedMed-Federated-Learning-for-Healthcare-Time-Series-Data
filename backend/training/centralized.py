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


def make_ecg_tensor(X, unsqueeze=True):
    t = torch.FloatTensor(X)
    if unsqueeze and t.dim() == 2:
        t = t.unsqueeze(1)
    return t


def make_har_tensor(X):
    t = torch.FloatTensor(X)
    return t


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

        # Detect if ECG (2D) or HAR (3D)
        is_ecg = dataset['X_train'].ndim == 2

        if is_ecg:
            X_train = make_ecg_tensor(dataset['X_train'])
            X_val = make_ecg_tensor(dataset['X_val'])
            X_test = make_ecg_tensor(dataset['X_test'])
        else:
            X_train = make_har_tensor(dataset['X_train'])
            X_val = make_har_tensor(dataset['X_val'])
            X_test = make_har_tensor(dataset['X_test'])

        y_train = torch.LongTensor(dataset['y_train'])
        y_val = torch.LongTensor(dataset['y_val'])
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
                        'loss': float(loss.item()),
                        'progress': (batch_idx / len(self.train_loader)) * 100
                    })

            val_metrics = self._evaluate(self.val_loader)
            train_loss = epoch_loss / len(self.train_loader)
            self.scheduler.step(val_metrics['loss'])

            epoch_summary = {
                'epoch': epoch,
                'train_loss': float(train_loss),
                'val_loss': float(val_metrics['loss']),
                'val_accuracy': float(val_metrics['accuracy']),
                'val_f1': float(val_metrics['f1']),
                'epoch_time': float(time.time() - epoch_start),
                'elapsed': float(time.time() - start_time)
            }
            self.epoch_metrics.append(epoch_summary)

            if self.callback:
                await self.callback({
                    'type': 'epoch_complete',
                    **epoch_summary
                })

            await asyncio.sleep(0.05)

        test_metrics = self._evaluate(self.test_loader)
        return {
            'epoch_metrics': self.epoch_metrics,
            'test_accuracy': float(test_metrics['accuracy']),
            'test_f1': float(test_metrics['f1']),
            'total_time': float(time.time() - start_time),
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
            'f1': f1_score(all_labels, all_preds, average='weighted', zero_division=0),
            'loss': total_loss / len(loader),
            'cm': confusion_matrix(all_labels, all_preds)
        }
