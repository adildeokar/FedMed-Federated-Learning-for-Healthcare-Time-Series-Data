"""
Model Factory — Create models by name for a given dataset type
"""
from models.cnn_ecg import ECGClassifier, LSTMECGClassifier
from models.cnn_har import HARClassifier, HARLSTMClassifier


def get_model(dataset_type: str, model_type: str = 'cnn'):
    """Get model class for dataset and model type"""
    if dataset_type == 'ecg':
        if model_type == 'lstm':
            return LSTMECGClassifier
        return ECGClassifier
    elif dataset_type == 'har':
        if model_type == 'lstm':
            return HARLSTMClassifier
        return HARClassifier
    else:
        raise ValueError(f"Unknown dataset type: {dataset_type}")


def get_model_info(dataset_type: str, model_type: str = 'cnn'):
    """Get model architecture info"""
    model_class = get_model(dataset_type, model_type)
    model = model_class()
    if hasattr(model, 'get_architecture_info'):
        return model.get_architecture_info()
    return {
        'name': f'{dataset_type.upper()} {model_type.upper()}',
        'parameters': sum(p.numel() for p in model.parameters() if p.requires_grad)
    }


AVAILABLE_MODELS = {
    'ecg': [
        {'id': 'cnn', 'name': 'ECG CNN', 'description': '1D CNN with 4 conv layers + BatchNorm'},
        {'id': 'lstm', 'name': 'ECG BiLSTM', 'description': 'Bidirectional LSTM with attention'},
    ],
    'har': [
        {'id': 'cnn', 'name': 'HAR CNN', 'description': '2D CNN for multi-channel sensor data'},
        {'id': 'lstm', 'name': 'HAR BiLSTM', 'description': 'Bidirectional LSTM for activity sequences'},
    ]
}
