"""
Federated Learning Simulation Orchestrator
Runs FL training, emits real-time updates via WebSocket callbacks.
Implements FedAvg manually for better WebSocket integration (no Flower server).
Emits per-client throughput (samples/sec) and per-round latency breakdowns.
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

        # Pre-compute partition class distributions for visualization
        self.partition_stats = self._compute_partition_stats()

        # Global model
        self.global_model = model_class().to(self.device)
        self.criterion = nn.CrossEntropyLoss()

        self.round_metrics = []
        self.is_running = False

    def _compute_partition_stats(self) -> List[dict]:
        """Pre-compute class distribution per client for the partition visualization."""
        stats = []
        for i, part in enumerate(self.client_partitions):
            y = part['y']
            unique, counts = np.unique(y, return_counts=True)
            class_dist = {int(k): int(v) for k, v in zip(unique, counts)}
            stats.append({
                'client_id': i,
                'n_samples': int(part['n_samples']),
                'class_distribution': class_dist,
                'dominant_classes': [int(c) for c in part.get('dominant_classes', [])],
            })
        return stats

    def _make_tensor(self, X):
        t = torch.FloatTensor(X)
        if self.is_ecg and t.dim() == 2:
            t = t.unsqueeze(1)
        return t

    def _train_client(self, client_id: int, model_params: List, client_data: dict):
        """Train one client; return params, n_samples, loss, train_time_s."""
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
        train_start = time.perf_counter()

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

        train_time_s = time.perf_counter() - train_start
        avg_loss = total_loss / max(n_batches, 1)
        updated_params = [val.cpu().numpy() for val in model.state_dict().values()]

        return updated_params, len(client_data['X']), float(avg_loss), float(train_time_s)

    def _fedavg_aggregate(self, client_params_list: List, client_sizes: List[int]) -> List:
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
        X_test = self._make_tensor(self.dataset['X_test'])
        y_test = torch.LongTensor(self.dataset['y_test'])
        loader = DataLoader(TensorDataset(X_test, y_test), batch_size=64)

        self.global_model.eval()
        all_preds, all_labels = [], []
        total_loss = 0

        t0 = time.perf_counter()
        with torch.no_grad():
            for X_b, y_b in loader:
                X_b, y_b = X_b.to(self.device), y_b.to(self.device)
                out = self.global_model(X_b)
                total_loss += self.criterion(out, y_b).item()
                all_preds.extend(out.argmax(dim=1).cpu().numpy())
                all_labels.extend(y_b.cpu().numpy())
        eval_time_s = time.perf_counter() - t0

        accuracy = accuracy_score(all_labels, all_preds)
        f1 = f1_score(all_labels, all_preds, average='weighted', zero_division=0)
        cm = confusion_matrix(all_labels, all_preds).tolist()
        avg_loss = total_loss / len(loader)

        return {
            'accuracy': float(accuracy),
            'f1_score': float(f1),
            'loss': float(avg_loss),
            'confusion_matrix': cm,
            'eval_time_s': float(eval_time_s),
        }

    async def run(self):
        """Run full federated training simulation with throughput + latency telemetry."""
        self.is_running = True
        global_params = [val.cpu().numpy() for val in self.global_model.state_dict().values()]
        param_bytes = sum(p.nbytes for p in global_params)

        # Emit partition stats once at the start so the UI can render the partition panel
        if self.callback:
            await self.callback({
                'type': 'partition_info',
                'partition_stats': self.partition_stats,
                'n_clients': self.n_clients,
                'n_classes': self.dataset['n_classes'],
                'classes': self.dataset.get('classes', []),
            })

        for round_num in range(1, self.n_rounds + 1):
            if not self.is_running:
                break

            round_start = time.perf_counter()
            client_results = []
            client_sizes = []
            round_client_metrics = []
            client_train_times: List[float] = []

            if self.callback:
                await self.callback({
                    'type': 'round_start',
                    'round': round_num,
                    'total_rounds': self.n_rounds,
                    'n_clients': self.n_clients,
                })

            # ── Train each client ──────────────────────────────────────────
            for client_id in range(self.n_clients):
                params, n_samples, client_loss, train_time_s = self._train_client(
                    client_id, global_params, self.client_partitions[client_id]
                )
                client_results.append(params)
                client_sizes.append(n_samples)
                client_train_times.append(train_time_s)

                # Throughput: samples processed per second for this client
                throughput_sps = n_samples * self.local_epochs / max(train_time_s, 1e-6)

                round_client_metrics.append({
                    'client_id': client_id,
                    'n_samples': int(n_samples),
                    'loss': float(client_loss),
                    'dominant_classes': self.client_partitions[client_id].get('dominant_classes', []),
                    'train_time_ms': float(train_time_s * 1000),
                    'throughput_sps': float(throughput_sps),
                })

                if self.callback:
                    await self.callback({
                        'type': 'client_update',
                        'round': round_num,
                        'client_id': client_id,
                        'loss': float(client_loss),
                        'n_samples': int(n_samples),
                        'progress': ((client_id + 1) / self.n_clients) * 100,
                        'train_time_ms': float(train_time_s * 1000),
                        'throughput_sps': float(throughput_sps),
                    })

                await asyncio.sleep(0.05)

            # ── FedAvg aggregation ─────────────────────────────────────────
            agg_start = time.perf_counter()

            if self.callback:
                await self.callback({
                    'type': 'aggregating',
                    'round': round_num,
                    'message': f'FedAvg aggregating {self.n_clients} clients...',
                })

            global_params = self._fedavg_aggregate(client_results, client_sizes)
            agg_time_s = time.perf_counter() - agg_start

            # Update global model
            state_dict = OrderedDict({
                k: torch.tensor(v)
                for k, v in zip(self.global_model.state_dict().keys(), global_params)
            })
            self.global_model.load_state_dict(state_dict)

            # ── Evaluate ───────────────────────────────────────────────────
            metrics = self._evaluate_global()
            eval_time_s = metrics.pop('eval_time_s')
            round_time_s = time.perf_counter() - round_start

            # Communication overhead: upload (weights → server) + download (weights → client)
            comm_cost_kb = float(param_bytes * 2 * self.n_clients / 1024)
            # Simulate network latency: ~1 ms per KB transferred (LAN assumption)
            simulated_comm_latency_ms = comm_cost_kb * 1.0

            # Total samples processed this round across all clients
            total_samples_round = sum(n * self.local_epochs for n in client_sizes)
            total_throughput_sps = total_samples_round / max(sum(client_train_times), 1e-6)

            round_summary = {
                'round': round_num,
                'accuracy': metrics['accuracy'],
                'f1_score': metrics['f1_score'],
                'loss': metrics['loss'],
                'confusion_matrix': metrics['confusion_matrix'],

                # Timing breakdown (all in ms for frontend convenience)
                'round_time_ms': float(round_time_s * 1000),
                'round_time': float(round_time_s),          # keep legacy field
                'agg_time_ms': float(agg_time_s * 1000),
                'eval_time_ms': float(eval_time_s * 1000),
                'avg_client_train_ms': float(
                    sum(client_train_times) / self.n_clients * 1000
                ),
                'comm_latency_ms': float(simulated_comm_latency_ms),

                # Throughput
                'throughput_sps': float(total_throughput_sps),  # aggregated
                'client_throughputs': [                          # per-client
                    m['throughput_sps'] for m in round_client_metrics
                ],

                # Communication
                'communication_cost_kb': comm_cost_kb,
                'n_clients_participated': self.n_clients,
                'client_metrics': round_client_metrics,
            }
            self.round_metrics.append(round_summary)

            if self.callback:
                await self.callback({'type': 'round_complete', **round_summary})

            await asyncio.sleep(0.1)

        self.is_running = False

        return {
            'round_metrics': self.round_metrics,
            'final_accuracy': self.round_metrics[-1]['accuracy'] if self.round_metrics else 0,
            'final_f1': self.round_metrics[-1]['f1_score'] if self.round_metrics else 0,
            'total_rounds': self.n_rounds,
            'n_clients': self.n_clients,
            'iid': True,
            'aggregation': 'FedAvg',
            'confusion_matrix': self.round_metrics[-1]['confusion_matrix'] if self.round_metrics else [],
            'partition_stats': self.partition_stats,
        }

    def stop(self):
        self.is_running = False
