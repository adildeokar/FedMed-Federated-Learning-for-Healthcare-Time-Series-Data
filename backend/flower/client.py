"""
Flower Federated Learning Client
Each client = simulated wearable device with local ECG/HAR data
"""
import torch
import torch.nn as nn
import numpy as np
from torch.utils.data import DataLoader, TensorDataset
from typing import Dict, List, Tuple
from collections import OrderedDict


class FederatedClient:
    """Manual Flower-compatible client for federated learning simulation."""

    def __init__(self, client_id: int, model, X_train, y_train, X_val, y_val,
                 device='cpu', learning_rate=0.001):
        self.client_id = client_id
        self.model = model.to(device)
        self.device = device
        self.lr = learning_rate

        is_ecg = np.array(X_train).ndim == 2

        if is_ecg:
            X_t = torch.FloatTensor(X_train).unsqueeze(1)
            X_v = torch.FloatTensor(X_val).unsqueeze(1)
        else:
            X_t = torch.FloatTensor(X_train)
            X_v = torch.FloatTensor(X_val)

        y_t = torch.LongTensor(y_train)
        y_v = torch.LongTensor(y_val)

        self.train_loader = DataLoader(TensorDataset(X_t, y_t), batch_size=32, shuffle=True)
        self.val_loader = DataLoader(TensorDataset(X_v, y_v), batch_size=64)

        self.criterion = nn.CrossEntropyLoss()
        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=learning_rate)
        self.history = []

    def get_parameters(self):
        return [val.cpu().numpy() for _, val in self.model.state_dict().items()]

    def set_parameters(self, parameters):
        params_dict = zip(self.model.state_dict().keys(), parameters)
        state_dict = OrderedDict({k: torch.tensor(v) for k, v in params_dict})
        self.model.load_state_dict(state_dict, strict=True)

    def fit(self, parameters, local_epochs=3):
        self.set_parameters(parameters)
        self.model.train()
        total_loss = 0.0

        for epoch in range(local_epochs):
            for X_batch, y_batch in self.train_loader:
                X_batch, y_batch = X_batch.to(self.device), y_batch.to(self.device)
                self.optimizer.zero_grad()
                output = self.model(X_batch)
                loss = self.criterion(output, y_batch)
                loss.backward()
                self.optimizer.step()
                total_loss += loss.item()

        avg_loss = total_loss / (len(self.train_loader) * local_epochs)
        return self.get_parameters(), len(self.train_loader.dataset), {'loss': float(avg_loss)}

    def evaluate(self, parameters):
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

        accuracy = correct / total if total > 0 else 0
        return loss / len(self.val_loader), total, {'accuracy': float(accuracy)}
