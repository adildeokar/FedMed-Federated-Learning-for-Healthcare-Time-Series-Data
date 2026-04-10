"""
FedMed Configuration Constants
"""

# Server
HOST = "0.0.0.0"
PORT = 8000

# Data paths
ECG_DATA_PATH = "data/mitbih"
HAR_DATA_PATH = "data/uci_har"

# ECG
ECG_SAMPLE_LENGTH = 187
ECG_N_CLASSES = 5
ECG_CLASS_LABELS = ['N', 'S', 'V', 'F', 'Q']
ECG_CLASS_NAMES = ['Normal (N)', 'Supraventricular (S)', 'Ventricular (V)', 'Fusion (F)', 'Unknown (Q)']

# HAR
HAR_SEQUENCE_LENGTH = 128
HAR_N_FEATURES = 9
HAR_N_CLASSES = 6
HAR_ACTIVITIES = ['Walking', 'Walking Upstairs', 'Walking Downstairs', 'Sitting', 'Standing', 'Laying']

# Training defaults
DEFAULT_LR = 0.001
DEFAULT_BATCH_SIZE = 64
DEFAULT_EPOCHS = 15

# Federated defaults
DEFAULT_N_CLIENTS = 5
DEFAULT_N_ROUNDS = 10
DEFAULT_LOCAL_EPOCHS = 3
