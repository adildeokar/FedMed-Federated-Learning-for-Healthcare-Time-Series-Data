"""
Metrics utilities — accuracy, F1, AUC calculation
"""
import numpy as np
from sklearn.metrics import (
    accuracy_score, f1_score, roc_auc_score,
    confusion_matrix, classification_report, precision_score, recall_score
)


def compute_metrics(y_true, y_pred, y_prob=None, class_names=None):
    """Compute comprehensive classification metrics"""
    metrics = {
        'accuracy': float(accuracy_score(y_true, y_pred)),
        'f1_weighted': float(f1_score(y_true, y_pred, average='weighted', zero_division=0)),
        'f1_macro': float(f1_score(y_true, y_pred, average='macro', zero_division=0)),
        'precision': float(precision_score(y_true, y_pred, average='weighted', zero_division=0)),
        'recall': float(recall_score(y_true, y_pred, average='weighted', zero_division=0)),
        'confusion_matrix': confusion_matrix(y_true, y_pred).tolist()
    }

    if y_prob is not None:
        try:
            if y_prob.ndim > 1:
                metrics['auc_ovr'] = float(roc_auc_score(y_true, y_prob, multi_class='ovr', average='weighted'))
        except Exception:
            pass

    # Per-class metrics
    per_class_f1 = f1_score(y_true, y_pred, average=None, zero_division=0)
    metrics['per_class_f1'] = [float(v) for v in per_class_f1]

    if class_names:
        metrics['class_names'] = class_names

    return metrics


def compute_convergence_rate(accuracy_history):
    """Estimate convergence rate from accuracy history"""
    if len(accuracy_history) < 3:
        return 0.0
    diffs = np.diff(accuracy_history)
    return float(np.mean(diffs[-3:]))


def compute_communication_efficiency(accuracy, comm_cost_kb):
    """Compute accuracy per KB of communication"""
    if comm_cost_kb <= 0:
        return 0.0
    return float(accuracy / comm_cost_kb * 1000)  # accuracy per MB
