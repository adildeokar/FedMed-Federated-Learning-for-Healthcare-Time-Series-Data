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

        self.fc1 = nn.Linear(256, 128)
        self.fc2 = nn.Linear(128, 64)
        self.fc3 = nn.Linear(64, n_classes)

    def forward(self, x):
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

    def get_architecture_info(self):
        return {
            'name': 'ECG CNN',
            'layers': ['Conv1D(1,32)', 'BN+ReLU+Pool', 'Conv1D(32,64)', 'BN+ReLU+Pool',
                       'Conv1D(64,128)', 'BN+ReLU+Pool', 'Conv1D(128,256)', 'GlobalAvgPool',
                       'FC(256,128)', 'FC(128,64)', 'FC(64,5)', 'Softmax'],
            'parameters': self.get_num_parameters()
        }


class LSTMECGClassifier(nn.Module):
    """Bidirectional LSTM for ECG classification"""
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

        # Attention mechanism
        attn_weights = torch.softmax(self.attention(lstm_out), dim=1)
        context = (lstm_out * attn_weights).sum(dim=1)

        out = F.relu(self.fc1(context))
        out = self.dropout(out)
        return self.fc2(out)

    def get_num_parameters(self):
        return sum(p.numel() for p in self.parameters() if p.requires_grad)

    def get_architecture_info(self):
        return {
            'name': 'ECG BiLSTM',
            'layers': ['BiLSTM(1,64,layers=2)', 'Attention', 'FC(128,64)', 'FC(64,5)', 'Softmax'],
            'parameters': self.get_num_parameters()
        }
