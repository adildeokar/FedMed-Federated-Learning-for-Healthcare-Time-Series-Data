# FedMed — Federated Learning for Healthcare Time-Series Data

## Project Overview
FedMed is a full-stack research platform demonstrating federated learning applied to healthcare ECG and wearable sensor data classification.

## Projects Demonstrated
- **Mini Project 3**: Federated Learning for Wearable Healthcare Data using Flower-style FedAvg framework
- **Major Project 2**: Complete FL system with centralized/distributed/federated performance comparison

## Datasets
- **ECG**: MIT-BIH Arrhythmia — 5-class (Normal, Supraventricular, Ventricular, Fusion, Unknown)  
- **HAR**: UCI Human Activity Recognition — 6-class wearable sensor data  
- Both datasets have **synthetic fallback generators** so the app works immediately in demo mode.

## Architecture
```
backend/                     # FastAPI + PyTorch + FL Simulation
├── main.py                  # FastAPI server + WebSocket
├── data/                    # ECG + HAR data loaders (with synthetic fallback)
├── models/                  # CNN + LSTM models for ECG and HAR
├── training/                # Centralized + Distributed trainers
├── flower/                  # FedAvg simulation (manual, no Flower server)
├── api/                     # REST endpoints + WebSocket manager
└── utils/                   # Metrics, signal processing, formatters

frontend/                    # React + TypeScript + Vite
├── src/
│   ├── pages/               # 6 pages: Dashboard, DataExplorer, Federated, Centralized, Distributed, Comparison
│   ├── components/          # Charts, Layout, Training, Dashboard, UI components
│   ├── hooks/               # useWebSocket, useTraining, useMetrics
│   ├── store/               # Zustand training store
│   └── types/               # TypeScript types
```

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```
Backend starts at: http://localhost:8000  
API docs: http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Open: http://localhost:5173

## Key Features
- **Real-time federated learning simulation** with live WebSocket progress updates
- **Animated federated topology** visualization — server + client nodes with flowing data lines
- **Three training modes**: Centralized, Distributed (AllReduce), Federated (FedAvg)
- **Privacy-preserving**: Only model weights aggregated, no raw data sharing in federated mode
- **Interactive ECG/HAR signal explorer** with dataset statistics and federated partition viewer
- **Live confusion matrix** and per-class metrics per round
- **Performance comparison** page with radar chart, bar chart, convergence curves
- **Export results** to JSON for project reports
- **Dark futuristic medical UI** with cyan/green glow theme

## Federated Learning Implementation
The FL simulation implements FedAvg manually:
1. Global model initialized → distributed to N clients
2. Each client trains locally for E epochs on private data
3. Updated weights uploaded to server
4. Server aggregates with weighted FedAvg
5. New global model evaluated on test set
6. Repeat for R rounds

## Evaluation Criteria Coverage
- ✅ **Communication rounds**: Tracked per round with convergence curves
- ✅ **Model convergence**: Accuracy, F1, Loss plotted per round in real-time
- ✅ **Client participation**: All clients participate each round, shown in topology diagram
- ✅ **Privacy preservation**: No raw data shared, only model weights
- ✅ **Comparison**: Centralized vs Distributed vs Federated on same dataset

## Tech Stack
| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts, Zustand |
| Backend | Python, FastAPI, WebSockets, PyTorch 2.1, scikit-learn |
| FL Framework | Custom FedAvg simulation (Flower-inspired) |
| Datasets | MIT-BIH ECG (synthetic), UCI HAR (synthetic) |
