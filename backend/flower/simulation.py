"""
Federated Learning Simulation Orchestrator
Runs FL training, emits real-time updates via WebSocket callbacks.
Implements FedAvg manually for better WebSocket integration (no Flower server).
"""
import asyncio
import numpy as np
import torch
import torch.nn as nn
from typing import Callable, Optional, List
import time
from sklearn.metrics import f1_score, accuracy_score, confusion_matrix
from torch.utils.data import DataLoader, TensorDataset
from collections import OrderedDict


class FederatedSimulator:
    """
    Manual FL simulation implementing FedAvg with real-time progress callbacks.
    Each round: distribute global model → clients train locally → aggregate via FedAvg.
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
        self.is_ecg = dataset['X_train'].ndim == 2

        # Partition data across clients
        if self.is_ecg:
            from data.ecg_loader import partition_for_federated
            self.client_partitions = partition_for_federated(dataset, n_clients, iid)
        else:
            from data.har_loader import partition_har_for_federated
            self.client_partitions = partition_har_for_federated(dataset, n_clients, iid)

        # Global model
        self.global_model = model_class().to(self.device)
        self.criterion = nn.CrossEntropyLoss()

        self.round_metrics = []
        self.is_running = False

    def _make_tensor(self, X):
        """Convert numpy array to tensor with correct shape"""
        t = torch.FloatTensor(X)
        if self.is_ecg and t.dim() == 2:
            t = t.unsqueeze(1)
        return t

    def _train_client(self, client_id: int, model_params: List, client_data: dict):
        """Train a single client locally and return updated params + metrics"""
        model = self.model_class().to(self.device)

        state_dict = OrderedDict({
            k: torch.tensor(v).to(self.device)
            for k, v in zip(model.state_dict().keys(), model_params)
        })
        model.load_state_dict(state_dict)

        X = self._make_tensor(client_data['X'])
        y = torch.LongTensor(client_data['y'])
        loader = DataLoader(TensorDataset(X, y), batch_size=32, shuffle=True)

        optimizer = torch.optim.Adam(model.parameters(), lr=self.lr)
        model.train()

        total_loss = 0
        n_batches = 0
        for _ in range(self.local_epochs):
            for X_b, y_b in loader:
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

        return updated_params, len(client_data['X']), float(avg_loss)

    def _fedavg_aggregate(self, client_params_list: List, client_sizes: List[int]) -> List:
        """FedAvg: weighted average of client parameters"""
        total_samples = sum(client_sizes)
        weights = [s / total_samples for s in client_sizes]

        aggregated = []
        for param_idx in range(len(client_params_list[0])):
            weighted_param = sum(
                w * params[param_idx]
                for w, params in zip(weights, client_params_list)
            )
            aggregated.append(weighted_param)

        return aggregated

    def _evaluate_global(self) -> dict:
        """Evaluate global model on test set"""
        X_test = self._make_tensor(self.dataset['X_test'])
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
        f1 = f1_score(all_labels, all_preds, average='weighted', zero_division=0)
        cm = confusion_matrix(all_labels, all_preds).tolist()
        avg_loss = total_loss / len(loader)

        return {
            'accuracy': float(accuracy),
            'f1_score': float(f1),
            'loss': float(avg_loss),
            'confusion_matrix': cm
        }

    async def run(self):
        """Run full federated training simulation"""
        self.is_running = True
        global_params = [val.cpu().numpy() for val in self.global_model.state_dict().values()]

        # Compute total communication cost once for param size reference
        param_bytes = sum(p.nbytes for p in global_params)

        for round_num in range(1, self.n_rounds + 1):
            if not self.is_running:
                break

            round_start = time.time()
            client_results = []
            client_sizes = []
            round_client_metrics = []

            if self.callback:
                await self.callback({
                    'type': 'round_start',
                    'round': round_num,
                    'total_rounds': self.n_rounds,
                    'n_clients': self.n_clients
                })

            # Train each client
            for client_id in range(self.n_clients):
                params, n_samples, client_loss = self._train_client(
                    client_id, global_params, self.client_partitions[client_id]
                )
                client_results.append(params)
                client_sizes.append(n_samples)
                round_client_metrics.append({
                    'client_id': client_id,
                    'n_samples': int(n_samples),
                    'loss': float(client_loss),
                    'dominant_classes': self.client_partitions[client_id].get('dominant_classes', [])
                })

                if self.callback:
                    await self.callback({
                        'type': 'client_update',
                        'round': round_num,
                        'client_id': client_id,
                        'loss': float(client_loss),
                        'n_samples': int(n_samples),
                        'progress': ((client_id + 1) / self.n_clients) * 100
                    })

                await asyncio.sleep(0.05)

            # Aggregation step
            if self.callback:
                await self.callback({
                    'type': 'aggregating',
                    'round': round_num,
                    'message': f'FedAvg aggregating {self.n_clients} clients...'
                })

            global_params = self._fedavg_aggregate(client_results, client_sizes)

            # Update global model
            state_dict = OrderedDict({
                k: torch.tensor(v)
                for k, v in zip(self.global_model.state_dict().keys(), global_params)
            })
            self.global_model.load_state_dict(state_dict)

            # Evaluate global model
            metrics = self._evaluate_global()
            round_time = time.time() - round_start

            # Communication cost in KB (upload + download per round)
            comm_cost_kb = float(param_bytes * 2 * self.n_clients / 1024)

            round_summary = {
                'round': round_num,
                'accuracy': metrics['accuracy'],
                'f1_score': metrics['f1_score'],
                'loss': metrics['loss'],
                'round_time': float(round_time),
                'client_metrics': round_client_metrics,
                'confusion_matrix': metrics['confusion_matrix'],
                'communication_cost_kb': comm_cost_kb,
                'n_clients_participated': self.n_clients
            }
            self.round_metrics.append(round_summary)

            if self.callback:
                await self.callback({
                    'type': 'round_complete',
                    **round_summary
                })

            await asyncio.sleep(0.1)

        self.is_running = False

        # Final results
        return {
            'round_metrics': self.round_metrics,
            'final_accuracy': self.round_metrics[-1]['accuracy'] if self.round_metrics else 0,
            'final_f1': self.round_metrics[-1]['f1_score'] if self.round_metrics else 0,
            'total_rounds': self.n_rounds,
            'n_clients': self.n_clients,
            'iid': True,
            'aggregation': 'FedAvg',
            'confusion_matrix': self.round_metrics[-1]['confusion_matrix'] if self.round_metrics else []
        }

    def stop(self):
        self.is_running = False
