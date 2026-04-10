"""
Flower Server — FedAvg Strategy
Custom server implementation with callback support
"""
import numpy as np
from typing import List, Tuple, Optional, Dict
from collections import OrderedDict
import torch


class FedAvgStrategy:
    """FedAvg aggregation strategy"""

    def __init__(self, min_fit_clients=2, min_available_clients=2,
                 fraction_fit=1.0, fraction_evaluate=1.0):
        self.min_fit_clients = min_fit_clients
        self.min_available_clients = min_available_clients
        self.fraction_fit = fraction_fit
        self.fraction_evaluate = fraction_evaluate

    def aggregate_fit(self, client_params_list: List[List[np.ndarray]],
                      client_sizes: List[int]) -> List[np.ndarray]:
        """FedAvg: weighted average of client parameters"""
        total_samples = sum(client_sizes)
        weights = [s / total_samples for s in client_sizes]

        aggregated = []
        n_params = len(client_params_list[0])
        for param_idx in range(n_params):
            weighted_param = sum(
                w * params[param_idx]
                for w, params in zip(weights, client_params_list)
            )
            aggregated.append(weighted_param)

        return aggregated

    def aggregate_evaluate(self, results: List[Tuple[int, Dict]]) -> Dict:
        """Aggregate evaluation results from clients"""
        total_samples = sum(n for n, _ in results)
        weighted_accuracy = sum(
            (n / total_samples) * metrics.get('accuracy', 0)
            for n, metrics in results
        )
        return {'accuracy': weighted_accuracy, 'total_samples': total_samples}
