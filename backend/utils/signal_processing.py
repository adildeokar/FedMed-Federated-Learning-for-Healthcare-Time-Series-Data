"""
ECG/EEG Signal Processing Utilities
"""
import numpy as np
from scipy import signal


def bandpass_filter(data, lowcut=0.5, highcut=40.0, fs=360.0, order=4):
    """Apply bandpass filter to ECG signal"""
    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq
    b, a = signal.butter(order, [low, high], btype='band')
    return signal.filtfilt(b, a, data)


def normalize_signal(data):
    """Normalize signal to [-1, 1]"""
    data_min = np.min(data)
    data_max = np.max(data)
    if data_max - data_min == 0:
        return data
    return 2 * (data - data_min) / (data_max - data_min) - 1


def compute_heart_rate(rr_intervals_ms):
    """Compute heart rate from RR intervals in milliseconds"""
    if len(rr_intervals_ms) == 0:
        return 0
    mean_rr = np.mean(rr_intervals_ms)
    if mean_rr == 0:
        return 0
    return 60000 / mean_rr  # BPM


def extract_features(signal_data, fs=360.0):
    """Extract basic signal features for display"""
    return {
        'mean': float(np.mean(signal_data)),
        'std': float(np.std(signal_data)),
        'max': float(np.max(signal_data)),
        'min': float(np.min(signal_data)),
        'rms': float(np.sqrt(np.mean(signal_data ** 2)))
    }
