"""
Data formatters for frontend visualization
"""
import numpy as np


def format_training_curve(epoch_metrics):
    """Format epoch metrics for recharts line chart"""
    return [
        {
            'epoch': m['epoch'],
            'trainLoss': round(m.get('train_loss', 0), 4),
            'valLoss': round(m.get('val_loss', 0), 4),
            'valAccuracy': round(m.get('val_accuracy', 0) * 100, 2),
            'valF1': round(m.get('val_f1', 0), 4)
        }
        for m in epoch_metrics
    ]


def format_fl_convergence(round_metrics):
    """Format FL round metrics for recharts"""
    return [
        {
            'round': m['round'],
            'accuracy': round(m.get('accuracy', 0) * 100, 2),
            'f1Score': round(m.get('f1_score', 0), 4),
            'loss': round(m.get('loss', 0), 4),
            'commCost': round(m.get('communication_cost_kb', 0), 2)
        }
        for m in round_metrics
    ]


def format_confusion_matrix(cm, class_names):
    """Format confusion matrix for heatmap visualization"""
    rows = []
    for i, row in enumerate(cm):
        total = sum(row)
        for j, val in enumerate(row):
            rows.append({
                'actual': class_names[i] if i < len(class_names) else str(i),
                'predicted': class_names[j] if j < len(class_names) else str(j),
                'count': int(val),
                'pct': round(val / total * 100, 1) if total > 0 else 0
            })
    return rows


def format_client_metrics(client_metrics):
    """Format per-client metrics for client status grid"""
    return [
        {
            'clientId': m['client_id'],
            'nSamples': m['n_samples'],
            'loss': round(m.get('loss', 0), 4),
            'dominantClasses': m.get('dominant_classes', [])
        }
        for m in client_metrics
    ]
