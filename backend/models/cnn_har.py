"""
CNN model for HAR (Human Activity Recognition) wearable sensor data
Input: (batch, n_features, seq_len) — multi-channel sensor data
"""
import torch
import torch.nn as nn
import torch.nn.functional as F


class HARClassifier(nn.Module):
    """
    2D CNN for HAR classification using multi-channel sensor data.
    Input: (batch, 1, 128, 9) — sequence × features
    Output: (batch, 6) — activity class probabilities
    """
    def __init__(self, n_classes=6, seq_len=128, n_features=9):
        super(HARClassifier, self).__init__()

        # Treat as 2D: (seq_len, n_features)
        self.conv1 = nn.Conv2d(1, 32, kernel_size=(3, 3), padding=1)
        self.bn1 = nn.BatchNorm2d(32)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=(3, 3), padding=1)
        self.bn2 = nn.BatchNorm2d(64)
        self.conv3 = nn.Conv2d(64, 128, kernel_size=(3, 3), padding=1)
        self.bn3 = nn.BatchNorm2d(128)

        self.pool = nn.MaxPool2d(2)
        self.dropout = nn.Dropout(0.4)
        self.global_pool = nn.AdaptiveAvgPool2d(1)

        self.fc1 = nn.Linear(128, 64)
        self.fc2 = nn.Linear(64, n_classes)

    def forward(self, x):
        # x: (batch, seq_len, n_features) → (batch, 1, seq_len, n_features)
        if x.dim() == 3:
            x = x.unsqueeze(1)
        elif x.dim() == 2:
            x = x.unsqueeze(1).unsqueeze(-1)

        x = self.dropout(self.pool(F.relu(self.bn1(self.conv1(x)))))
        x = self.dropout(self.pool(F.relu(self.bn2(self.conv2(x)))))
        x = F.relu(self.bn3(self.conv3(x)))
        x = self.global_pool(x).squeeze(-1).squeeze(-1)
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        return self.fc2(x)

    def get_num_parameters(self):
        return sum(p.numel() for p in self.parameters() if p.requires_grad)

    def get_architecture_info(self):
        return {
            'name': 'HAR CNN',
            'layers': ['Conv2D(1,32)', 'BN+ReLU+Pool', 'Conv2D(32,64)', 'BN+ReLU+Pool',
                       'Conv2D(64,128)', 'GlobalAvgPool', 'FC(128,64)', 'FC(64,6)', 'Softmax'],
            'parameters': self.get_num_parameters()
        }


class HARLSTMClassifier(nn.Module):
    """LSTM for HAR classification"""
    def __init__(self, n_classes=6, n_features=9, hidden_size=128, num_layers=2):
        super(HARLSTMClassifier, self).__init__()
        self.lstm = nn.LSTM(n_features, hidden_size, num_layers=num_layers,
                            batch_first=True, bidirectional=True, dropout=0.3)
        self.fc1 = nn.Linear(hidden_size * 2, 64)
        self.fc2 = nn.Linear(64, n_classes)
        self.dropout = nn.Dropout(0.3)

    def forward(self, x):
        # x: (batch, seq_len, n_features) or (batch, 1, seq_len) → need (batch, seq_len, n_features)
        if x.dim() == 2:
            x = x.unsqueeze(-1)
        lstm_out, (hn, _) = self.lstm(x)
        # Use last hidden state
        out = torch.cat([hn[-2], hn[-1]], dim=1)
        out = F.relu(self.fc1(out))
        out = self.dropout(out)
        return self.fc2(out)

    def get_num_parameters(self):
        return sum(p.numel() for p in self.parameters() if p.requires_grad)
