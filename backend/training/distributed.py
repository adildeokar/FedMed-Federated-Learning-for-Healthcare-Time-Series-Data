"""
Distributed Training — Simulated data-parallel training
Simulates N workers processing data shards in parallel, then synchronizing gradients.
"""
import torch
import torch.nn as nn
import numpy as np
import time
import asyncio
from torch.utils.data import DataLoader, TensorDataset
from sklearn.metrics import f1_score, accuracy_score, confusion_matrix
from typing import Callable, Optional
from collections import OrderedDict


class DistributedTrainer:
    """
    Simulates distributed data-parallel training with N workers.
    Each epoch: data is split across workers, each worker computes gradients,
    then gradients are averaged (AllReduce simulation).
    """
    def __init__(self, model_class, dataset, n_workers=3, epochs=15, lr=0.001,
                 batch_size=64, callback: Optional[Callable] = None):
        self.model_class = model_class
        self.dataset = dataset
        self.n_workers = n_workers
        self.epochs = epochs
        self.lr = lr
        self.batch_size = batch_size
        self.callback = callback
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

        # Global model
        self.global_model = model_class().to(self.device)
        self.criterion = nn.CrossEntropyLoss()

        is_ecg = dataset['X_train'].ndim == 2

        if is_ecg:
            X_train = torch.FloatTensor(dataset['X_train']).unsqueeze(1)
            X_val = torch.FloatTensor(dataset['X_val']).unsqueeze(1)
            X_test = torch.FloatTensor(dataset['X_test']).unsqueeze(1)
        else:
            X_train = torch.FloatTensor(dataset['X_train'])
            X_val = torch.FloatTensor(dataset['X_val'])
            X_test = torch.FloatTensor(dataset['X_test'])

        y_train = torch.LongTensor(dataset['y_train'])
        y_val = torch.LongTensor(dataset['y_val'])
        y_test = torch.LongTensor(dataset['y_test'])

        # Split training data across workers
        n_samples = len(X_train)
        indices = np.random.permutation(n_samples)
        splits = np.array_split(indices, n_workers)

        self.worker_loaders = []
        for split in splits:
            split_tensor = torch.LongTensor(split)
            X_w = X_train[split_tensor]
            y_w = y_train[split_tensor]
            loader = DataLoader(TensorDataset(X_w, y_w), batch_size=batch_size, shuffle=True)
            self.worker_loaders.append(loader)

        self.val_loader = DataLoader(TensorDataset(X_val, y_val), batch_size=batch_size * 2)
        self.test_loader = DataLoader(TensorDataset(X_test, y_test), batch_size=batch_size * 2)

        self.epoch_metrics = []

    def _compute_worker_gradients(self, worker_loader, model_params):
        """Compute gradients for one worker"""
        model = self.model_class().to(self.device)
        state_dict = OrderedDict({
            k: torch.tensor(v).to(self.device)
            for k, v in zip(model.state_dict().keys(), model_params)
        })
        model.load_state_dict(state_dict)
        optimizer = torch.optim.Adam(model.parameters(), lr=self.lr)

        model.train()
        total_loss = 0
        n_batches = 0

        for X_b, y_b in worker_loader:
            X_b, y_b = X_b.to(self.device), y_b.to(self.device)
            optimizer.zero_grad()
            out = model(X_b)
            loss = self.criterion(out, y_b)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
            n_batches += 1

        avg_loss = total_loss / max(n_batches, 1)
        updated_params = [val.cpu().numpy() for val in model.state_dict().values()]
        return updated_params, avg_loss

    def _allreduce_params(self, worker_params_list):
        """Simulate AllReduce: average model parameters across workers"""
        aggregated = []
        n_workers = len(worker_params_list)
        for param_idx in range(len(worker_params_list[0])):
            avg_param = sum(params[param_idx] for params in worker_params_list) / n_workers
            aggregated.append(avg_param)
        return aggregated

    def _evaluate(self, loader):
        self.global_model.eval()
        all_preds, all_labels = [], []
        total_loss = 0

        with torch.no_grad():
            for X_b, y_b in loader:
                X_b, y_b = X_b.to(self.device), y_b.to(self.device)
                out = self.global_model(X_b)
                total_loss += self.criterion(out, y_b).item()
                all_preds.extend(out.argmax(1).cpu().numpy())
                all_labels.extend(y_b.cpu().numpy())

        return {
            'accuracy': accuracy_score(all_labels, all_preds),
            'f1': f1_score(all_labels, all_preds, average='weighted', zero_division=0),
            'loss': total_loss / len(loader),
            'cm': confusion_matrix(all_labels, all_preds)
        }

    async def train(self):
        start_time = time.time()
        global_params = [val.cpu().numpy() for val in self.global_model.state_dict().values()]

        for epoch in range(1, self.epochs + 1):
            epoch_start = time.time()

            if self.callback:
                await self.callback({
                    'type': 'epoch_start',
                    'epoch': epoch,
                    'n_workers': self.n_workers
                })

            worker_params_list = []
            worker_losses = []

            for w_id in range(self.n_workers):
                params, w_loss = self._compute_worker_gradients(self.worker_loaders[w_id], global_params)
                worker_params_list.append(params)
                worker_losses.append(w_loss)

                if self.callback:
                    await self.callback({
                        'type': 'worker_update',
                        'epoch': epoch,
                        'worker_id': w_id,
                        'loss': float(w_loss),
                        'progress': ((w_id + 1) / self.n_workers) * 100
                    })

                await asyncio.sleep(0.05)

            # AllReduce
            global_params = self._allreduce_params(worker_params_list)

            # Update global model
            state_dict = OrderedDict({
                k: torch.tensor(v)
                for k, v in zip(self.global_model.state_dict().keys(), global_params)
            })
            self.global_model.load_state_dict(state_dict)

            val_metrics = self._evaluate(self.val_loader)
            train_loss = float(np.mean(worker_losses))
            epoch_time = time.time() - epoch_start

            speedup = self.n_workers * 0.7  # Simulated speedup factor

            epoch_summary = {
                'epoch': epoch,
                'train_loss': train_loss,
                'val_loss': float(val_metrics['loss']),
                'val_accuracy': float(val_metrics['accuracy']),
                'val_f1': float(val_metrics['f1']),
                'epoch_time': float(epoch_time),
                'elapsed': float(time.time() - start_time),
                'worker_losses': [float(l) for l in worker_losses],
                'speedup': float(speedup)
            }
            self.epoch_metrics.append(epoch_summary)

            if self.callback:
                await self.callback({
                    'type': 'epoch_complete',
                    **epoch_summary
                })

            await asyncio.sleep(0.05)

        test_metrics = self._evaluate(self.test_loader)
        total_time = time.time() - start_time

        return {
            'epoch_metrics': self.epoch_metrics,
            'test_accuracy': float(test_metrics['accuracy']),
            'test_f1': float(test_metrics['f1']),
            'total_time': float(total_time),
            'confusion_matrix': test_metrics['cm'].tolist(),
            'n_workers': self.n_workers,
            'speedup_factor': float(self.n_workers * 0.7)
        }
