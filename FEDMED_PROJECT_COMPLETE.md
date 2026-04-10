# FedMed — Complete Project Documentation

This document is a single, end-to-end reference for the **FedMed** application: what it is, why it exists, how it is structured, and how every major technical piece works. It is written from the **actual codebase** in this repository (as of the documented state), and calls out places where earlier design notes or UI copy differ from implementation.

---

## Table of Contents

1. [What FedMed Is](#1-what-fedmed-is)
2. [Why FedMed Was Created](#2-why-fedmed-was-created)
3. [Goals, Scope, and What FedMed Is Not](#3-goals-scope-and-what-fedmed-is-not)
4. [High-Level Architecture](#4-high-level-architecture)
5. [Technology Stack (As Implemented)](#5-technology-stack-as-implemented)
6. [Datasets and Data Pipeline](#6-datasets-and-data-pipeline)
7. [Machine Learning Models](#7-machine-learning-models)
8. [Training Paradigms](#8-training-paradigms)
9. [Backend — Detailed Technical Reference](#9-backend--detailed-technical-reference)
10. [Frontend — Detailed Technical Reference](#10-frontend--detailed-technical-reference)
11. [Real-Time Protocol (WebSocket)](#11-real-time-protocol-websocket)
12. [REST API Reference](#12-rest-api-reference)
13. [Configuration and Defaults](#13-configuration-and-defaults)
14. [Running the Application](#14-running-the-application)
15. [Utilities, Metrics, and Supporting Code](#15-utilities-metrics-and-supporting-code)
16. [Evaluation Criteria and Pedagogical Alignment](#16-evaluation-criteria-and-pedagogical-alignment)
17. [Privacy and Compliance Narrative](#17-privacy-and-compliance-narrative)
18. [Limitations, Known Gaps, and Spec vs Code](#18-limitations-known-gaps-and-spec-vs-code)
19. [Repository Layout](#19-repository-layout)
20. [Glossary](#20-glossary)

---

## 1. What FedMed Is

**FedMed** (Federated Learning for **Med**ical time-series) is a **full-stack research and demonstration platform** that trains neural networks on **healthcare-related time-series data** in three modes:

- **Centralized** — all training data in one place; standard supervised learning baseline.
- **Distributed** — simulated **data-parallel** training with multiple workers and an **AllReduce-style** parameter average each epoch.
- **Federated** — simulated **horizontal federated learning** with multiple **clients** holding **disjoint local shards** of training data; the server aggregates client model weights with **FedAvg** (federated averaging).

The user experience is a **live interactive dashboard**: training runs in the **Python/PyTorch backend**, and the **React** frontend receives **streaming progress** over **WebSockets**, updating charts, topology animations, confusion matrices, and logs in near real time.

Two dataset families are supported:

| Dataset key | Domain | Classes | Input shape (typical) |
|-------------|--------|---------|------------------------|
| `ecg` | ECG beat classification (MIT-BIH–style labeling) | 5 | `(N, 187)` → model input `(batch, 1, 187)` |
| `har` | Human activity from wearable sensors (UCI HAR–style) | 6 | `(N, 128, 9)` → CNN treats as 2D `(1, 128, 9)` |

The application is explicitly framed in the UI and docs as supporting **Mini Project 3** (federated learning on wearable/healthcare data) and **Major Project 2** (comparison across centralized, distributed, and federated training).

---

## 2. Why FedMed Was Created

FedMed was created to serve several overlapping purposes:

1. **Education and coursework** — Provide a **complete, runnable** system that demonstrates federated learning concepts (client/server roles, rounds, local epochs, aggregation, communication cost) with **visible metrics** and **interpretable medical/wearable tasks**.

2. **Research-style comparison** — Enable side-by-side reasoning about **accuracy**, **F1**, **training time**, **privacy posture** (narrative), and **communication** patterns across the three training paradigms.

3. **Privacy-preserving ML narrative** — Illustrate that in the **federated** setting, the **simulation** keeps **raw data on logical clients** and only exchanges **model parameters** with the aggregating process—useful for discussing GDPR-style constraints in healthcare IoT, even though this remains a **local simulation**, not a real multi-hospital deployment.

4. **Operational demo reliability** — Ship with **synthetic data generators** and optional **real data loaders** so demos work **without manual dataset downloads**, while still supporting real CSV/numpy-text pipelines when files are present.

5. **Modern full-stack practice** — Combine **FastAPI**, **async** job orchestration, **PyTorch**, and a **TypeScript/React** SPA with **state management** and **charts**, reflecting how ML platforms are often productized.

---

## 3. Goals, Scope, and What FedMed Is Not

### In scope

- End-to-end **training** and **evaluation** for ECG and HAR classification.
- **Simulated** federated and distributed training with **clear pedagogical semantics**.
- **Real-time UI** updates for training progress.
- **Dataset exploration** (samples, stats, federated partition visualization).
- **Export** of JSON results from the UI for reports.

### Out of scope (not claimed by the code)

- Production **multi-tenant security**, **authentication**, or **encryption** of transport beyond what the dev stack provides.
- True **cross-network** federated learning (each “client” is a **logical partition** on the same machine/process flow).
- **Differential privacy**, **secure aggregation**, or **homomorphic encryption** (not implemented).
- **Clinical validation** or regulatory clearance—the models and data are for **demonstration**, not diagnosis.

---

## 4. High-Level Architecture

```mermaid
flowchart LR
  subgraph browser [Browser SPA]
    UI[React Pages and Components]
    Z[Zustand Store]
    WS_C[WebSocket Client]
    UI --> Z
    WS_C --> Z
  end

  subgraph backend [Python Backend]
    API[FastAPI REST Routers]
    WSS[WebSocket /ws/{client_id}]
    JOB[run_training_job async task]
    DATA[data loaders + partitions]
    TRAIN[CentralizedTrainer / DistributedTrainer / FederatedSimulator]
    TORCH[PyTorch Models]
    WSS --> JOB
    JOB --> DATA
    JOB --> TRAIN
    TRAIN --> TORCH
  end

  UI --> API
  WS_C <--> WSS
```

**Request flow (training):**

1. User configures training in the SPA and clicks start.
2. Frontend opens (or reuses) a WebSocket to `ws://localhost:8000/ws/{clientId}` and sends `{ type: 'start_training', config }`.
3. Backend assigns a `job_id`, spawns `asyncio.create_task(run_training_job(...))`, and streams messages (`loading`, `dataset_loaded`, per-epoch or per-round events, `training_complete`, or `error`).
4. Frontend `handleWebSocketMessage` updates Zustand; components re-render charts and panels.

---

## 5. Technology Stack (As Implemented)

### Backend (`backend/`)

| Component | Technology | Notes |
|-----------|------------|--------|
| API framework | **FastAPI** | `main.py`, OpenAPI at `/docs` |
| Server | **Uvicorn** | `uvicorn.run` when executing `main.py` |
| Real-time | **WebSockets** (FastAPI / Starlette) | Not Socket.IO |
| ML | **PyTorch** | `torch>=2.2.0` in `requirements.txt` |
| Tabular / ML utilities | **NumPy**, **pandas**, **scikit-learn**, **SciPy** | Metrics, splits, scaling |
| Validation | **Pydantic v2** | `TrainingConfig` model in routes |
| FL algorithm | **Custom FedAvg** in `flower/simulation.py` | No `flwr` package in `requirements.txt` |

### Frontend (`frontend/`)

| Component | Technology | Notes |
|-----------|------------|--------|
| UI library | **React 18** | |
| Language | **TypeScript** | |
| Build tool | **Vite 5** | |
| Routing | **React Router v6** | |
| Styling | **Tailwind CSS** + extensive **inline styles** | Medical/dark theme |
| Animation | **Framer Motion** | |
| Charts | **Recharts** | |
| Client state | **Zustand** | Training and WebSocket-driven state |
| Server state | **TanStack React Query** | Dataset info, samples, partitions, presets |
| Icons | **Lucide React** | |
| Class merging | **clsx**, **tailwind-merge** | |

**Not present in `package.json` (despite some design docs mentioning them):** `socket.io-client`, `shadcn/ui` as a dependency tree.

### DevOps / scripts

- `start_backend.ps1` — `cd backend; python main.py`
- `start_frontend.ps1` — `cd frontend; npm run dev`

---

## 6. Datasets and Data Pipeline

### 6.1 ECG (`data/ecg_loader.py`)

**Intended real source:** MIT-BIH–style **preprocessed** data as CSV:

- `data/mitbih/mitbih_train.csv` — features in columns, **label in last column**
- `data/mitbih/mitbih_test.csv` — same layout

**Loading behavior:**

- `load_ecg_dataset(use_real=False, data_path='data/mitbih')` is what `main.py` calls today (`load_ecg_dataset()` with defaults) → **synthetic** data unless you change the call site.
- If `use_real=True` **and** the path exists, `load_real_mitbih` runs; on failure it prints and returns `None`, then synthetic is used.

**Synthetic ECG:**

- `generate_synthetic_ecg_dataset(n_samples=6000 in default path)` creates **5 classes** with morphologically distinct **Gaussian bumps** and sines per class (Normal, Supraventricular, Ventricular, Fusion, Unknown).
- Sample length **187** (`SAMPLE_LENGTH`).

**Splits and scaling:**

- `split_and_scale`: `StandardScaler` on features, stratified `train_test_split` for test (20%) and validation (10% of original train).

**Class semantics:**

- Labels `N, S, V, F, Q` with human-readable names `Normal (N)`, etc.

**Federated partition (`partition_for_federated`):**

- **IID:** random permutation, `np.array_split` across `n_clients`.
- **Non-IID:** each client `i` favors classes `(i % n_classes)` and `(i+1) % n_classes` (~70% from “dominant” union, ~30% from others), exposing **label skew** typical in federated learning papers.

**Visualization helper:** `get_sample_signals(dataset, n_per_class)` for per-class waveforms.

### 6.2 HAR (`data/har_loader.py`)

**Intended real source:** UCI HAR–style folder layout:

- `data/uci_har/train/X_train.txt`, `y_train.txt`
- `data/uci_har/test/X_test.txt`, `y_test.txt`
- Labels in files are **1-indexed**; loader subtracts 1 for **0..5**.

**Real-data tensor shape:** reshaped to `(N, -1, 1)` in loader (flattened sequence per sample as used there—implementation detail for file format).

**Synthetic HAR:**

- `generate_synthetic_har_dataset`: **6 activities**, **128** time steps, **9** channels; sinusoidal patterns with activity-specific frequency/amplitude/noise.

**Federated partition:** `partition_har_for_federated` — same IID / non-IID idea as ECG, with guards when index sets are empty.

### 6.3 Dataset manager (`data/dataset_manager.py`)

- `get_dataset(dataset_type, use_real=False)` — **in-memory cache** keyed by `f"{dataset_type}_{use_real}"`.
- `get_dataset_info` — counts, shapes, class lists for REST responses.

---

## 7. Machine Learning Models

### 7.1 ECG CNN — `ECGClassifier` (`models/cnn_ecg.py`)

- **Input:** `(batch, 1, 187)`
- **Blocks:** Four `Conv1d` layers with `BatchNorm1d`, `ReLU`, `MaxPool1d(2)`, `Dropout(0.3)` on early pools; then `AdaptiveAvgPool1d(1)`.
- **Head:** `Linear(256→128) → ReLU → Dropout → Linear(128→64) → ReLU → Dropout → Linear(64→5)` (logits; cross-entropy in training).
- **Helpers:** `get_num_parameters()`, `get_architecture_info()`.

### 7.2 ECG BiLSTM — `LSTMECGClassifier`

- Permutes input to `(batch, length, 1)` for `LSTM`.
- **BiLSTM** `hidden_size=64`, `num_layers=2`, `dropout=0.3`.
- **Attention:** learned scalar weights over time steps, weighted sum of LSTM outputs.
- **Head:** `Linear(128→64) → ReLU → Dropout → Linear(64→5)`.

### 7.3 HAR CNN — `HARClassifier` (`models/cnn_har.py`)

- Accepts `(batch, seq, features)`; inserts channel dimension → `(batch, 1, 128, 9)`.
- **Conv2d** stack (32/64/128 channels), `BatchNorm2d`, pooling, `Dropout(0.4)`, global average pool, `Linear(128→64) → ReLU → Dropout → Linear(64→6)`.

### 7.4 HAR BiLSTM — `HARLSTMClassifier`

- `LSTM` over `(batch, seq, n_features)` with bidirectional hidden; concatenates final forward/backward hidden states; FC head to 6 classes.

### 7.5 Model factory (`models/model_factory.py`)

- `get_model(dataset_type, model_type)` returns the appropriate class.
- `AVAILABLE_MODELS` describes options for API listing.
- **Note:** `main.py` wires **HAR + lstm** to `LSTMECGClassifier` is **not** the case—it uses `HARClassifier` for `har` and `LSTMECGClassifier` only when `dataset=='ecg'` and `model=='lstm'`. So **`HARLSTMClassifier` exists in code but is not selected** by the current `main.py` branch (a gap worth fixing if HAR+LSTM is required).

---

## 8. Training Paradigms

### 8.1 Centralized — `training/centralized.py`

- Single model on GPU if available else CPU.
- `DataLoader` on train/val/test tensors; **Adam** + **CrossEntropyLoss**.
- **ReduceLROnPlateau** scheduler on validation loss.
- Each epoch: batches; every **5 batches** emits `batch_update` for UI granularity.
- End of epoch: validation metrics → `epoch_complete`.
- Final: `test_accuracy`, `test_f1`, `confusion_matrix`, `total_time`.

### 8.2 Distributed (simulated) — `training/distributed.py`

- **Concept:** Each epoch, `n_workers` each run one local pass over their **data shard** starting from the **same global weights**, then parameters are **averaged** (`_allreduce_params`) and loaded into `global_model`.
- **Important:** This is **not** true distributed PyTorch (`DistributedDataParallel`); it is a **pedagogical simulation** of data-parallel synchronization.
- Emits `epoch_start`, `worker_update`, `epoch_complete` with **simulated** `speedup = n_workers * 0.7` for display narratives.

### 8.3 Federated — `flower/simulation.py` (`FederatedSimulator`)

**Algorithm (FedAvg):**

1. Initialize global model.
2. For each round `1..n_rounds`:
   - Broadcast current global weight tensors to each client (represented as list of numpy arrays).
   - Each client: load weights into a fresh model, train **local_epochs** with **Adam** on **private** `(X, y)` partition, batch size **32**.
   - Collect updated weights; **aggregate** with sample-weighted average:  
     \(w = \sum_k (n_k / N) w_k\) per parameter tensor.
   - Load aggregated weights into `global_model`.
   - Evaluate on **global test set**; compute accuracy, weighted F1, loss, confusion matrix.
   - Emit WebSocket events (see [Section 11](#11-real-time-protocol-websocket)).

**Communication cost (reported):**

- `param_bytes` = sum of numpy nbytes of all parameters.
- Per round: `comm_cost_kb = param_bytes * 2 * n_clients / 1024` (upload + download heuristic).

**IID vs non-IID:** Controlled by config `iid` passed from frontend; partitions use ECG or HAR partition functions.

**Return payload:** `round_metrics`, `final_accuracy`, `final_f1`, `aggregation: 'FedAvg'`, etc. **Note:** the returned dict sets `'iid': True` **hardcoded** regardless of actual `iid` flag—a small inconsistency for consumers of JSON export.

### 8.4 Legacy / alternate FL helpers (`flower/client.py`, `flower/server.py`)

- `FederatedClient` and `FedAvgStrategy` implement **compatible concepts** (fit, parameter get/set, weighted FedAvg) but **`FederatedSimulator` is what `main.py` uses** for training orchestration and callbacks.

---

## 9. Backend — Detailed Technical Reference

### 9.1 Application entry — `main.py`

- Instantiates **FastAPI** app `FedMed API` v1.0.0.
- **CORS** allows local dev origins (`5173`, `3000`).
- Routers:
  - `/api/training` → `api.routes.training`
  - `/api/datasets` → `api.routes.datasets`
  - `/api/metrics` → `api.routes.metrics`
  - `/api/models` → `api.routes.models_router`
- **WebSocket** route `/ws/{client_id}`:
  - `start_training` → creates job, `asyncio.create_task(run_training_job)`
  - `stop_training` → sets `active_jobs[job_id]['stop'] = True` (trainer checks this in federated path via `emit`; centralized uses same `emit` wrapper)
  - `ping` → `pong`
- **`run_training_job`:** loads dataset, selects model class, dispatches trainer/simulator, catches exceptions and sends traceback string to client.

### 9.2 WebSocket manager — `api/websocket.py`

- `ConnectionManager`: map `client_id → WebSocket`.
- `send_personal_message`: JSON serialize with `default=float` for numpy types.
- `broadcast` helper exists for future use.

### 9.3 REST: training — `api/routes/training.py`

- `GET /api/training/presets` — Quick Demo, Standard, Full Experiment presets.
- `GET /api/training/status` — **Static placeholder** (`active_jobs: 0`) — not wired to `active_jobs` in `main.py`.

### 9.4 REST: datasets — `api/routes/datasets.py`

- `GET /api/datasets/info/{dataset_type}` — stats via `dataset_manager.get_dataset_info`.
- `GET /api/datasets/samples/{dataset_type}?n_per_class=3` — sample tensors for plotting.
- `GET /api/datasets/partition/{dataset_type}?n_clients=5&iid=true` — per-client class histograms for federated visualization.

### 9.5 REST: metrics — `api/routes/metrics.py`

- `GET /api/metrics/comparison` — returns **hardcoded** `DEFAULT_RESULTS` with `is_mock: True`.
- `GET /api/metrics/default` — same defaults without wrapper.

These defaults align with **demo** numbers shown in the Comparison page when no live results exist.

### 9.6 REST: models — `api/routes/models_router.py`

- `GET /api/models/list` — `AVAILABLE_MODELS`.
- `GET /api/models/info/{dataset_type}/{model_type}` — architecture info via `get_model_info`.

### 9.7 Health and root

- `GET /api/health` → `{ status, version }`
- `GET /` → welcome JSON with `/docs` pointer

### 9.8 Configuration — `config.py`

Central constants: server host/port, dataset paths, class counts/names, default hyperparameters for ECG/HAR and federated settings.

---

## 10. Frontend — Detailed Technical Reference

### 10.1 Entry and routing — `main.tsx`, `App.tsx`

- `App` wraps routes in `Layout`:
  - `/` Dashboard
  - `/data` Data Explorer
  - `/federated` Federated Training (**MAIN** in sidebar)
  - `/centralized` Centralized Training
  - `/distributed` Distributed Training
  - `/comparison` Comparison
  - `/about` About

### 10.2 Layout — `components/layout/`

- **Layout.tsx** — shell for sidebar + top bar + outlet.
- **Sidebar.tsx** — navigation, **WebSocket connection pulse** (`wsConnected`), training pulse (`isTraining`). Footer text mentions “FedAvg • Flower • PyTorch” (see [Section 18](#18-limitations-known-gaps-and-spec-vs-code)).
- **TopBar.tsx** — header chrome.

### 10.3 Global training state — `store/trainingStore.ts`

Zustand store holds:

- Connection flags, `activeJobId`, `isTraining`, `trainingType`, `config`
- Progress scalars: epoch/round, loss, accuracy, F1, progress %
- Histories: `epochHistory`, `roundHistory`, `clientHistory`
- Federated **clientStates** map (`idle` | `training` | `sending` | `done`)
- Last results per mode: `centralizedResults`, `distributedResults`, `federatedResults`
- `trainingLogs` ring buffer (last 200 entries)
- `handleWebSocketMessage` — large switch on backend message `type`

### 10.4 Hooks

- **`useWebSocket.ts`** — connects to `ws://localhost:8000/ws/{randomId}`, auto-reconnect ~3s, registers handlers, exposes `sendStartTraining`, `sendStopTraining`.
- **`useTraining.ts`** — bridges store + WebSocket: generates local `job-...` id for UI, calls `sendStartTraining(config)` on start.
- **`useMetrics.ts`** — React Query hooks: `useDefaultMetrics`, `useDatasetInfo`, `useDatasetSamples`, `useFederatedPartition`, `usePresets` against `http://localhost:8000/api/...`.

### 10.5 Types — `types/training.ts`

- `TrainingConfig`, `TrainingMessage` union, metric interfaces, `ComparisonData`.

### 10.6 Pages (behavioral summary)

| Page | Role |
|------|------|
| **Dashboard** | Hero, stats, model/project cards, recent activity mixing **live** results and **demo** numbers, navigation CTAs |
| **DataExplorer** | Dataset tabs, samples, partition stats (via React Query) |
| **FederatedTraining** | Full FL UI: `TrainingConfig`, `FederatedTopology`, logs, `ClientStatusGrid`, `MetricsPanel`, convergence + confusion matrix, JSON export |
| **CentralizedTraining** | Epoch-centric charts/metrics |
| **DistributedTraining** | Worker-centric visualization |
| **Comparison** | Radar/bar charts, summary table, privacy cards; merges **store results** with **DEFAULT** placeholders; convergence chart mixes synthetic curves with partial real `roundHistory`; JSON export |
| **About** | Pedagogical copy, FL steps, stack list, evaluation criteria, quick start |

### 10.7 Components (grouped)

- **training/** — `TrainingConfig` (presets, sliders, IID toggle for federated), `TrainingProgress` / log, `MetricsPanel`.
- **charts/** — `FederatedTopology`, `TrainingCurve`, `ConfusionMatrix`, `ClientStatusGrid`, `ComparisonRadar`, `ECGWaveform`, etc.
- **dashboard/** — `StatsCard`, `ModelCard`.
- **ui/** — `GlowButton`, `ParticleBackground`, `PulseIndicator`, `AnimatedCounter`.

### 10.8 Styling and UX theme

- Dark **medical / cyber** aesthetic: cyan (`#00d4ff`) and green (`#00ff88`) accents, `Rajdhani` + `JetBrains Mono` + `DM Sans` (per inline styles).
- Framer Motion for subtle motion on cards and navigation.

---

## 11. Real-Time Protocol (WebSocket)

**URL:** `ws://localhost:8000/ws/{client_id}`

### Client → Server

| `type` | Payload | Effect |
|--------|---------|--------|
| `start_training` | `{ config: TrainingConfig }` | Spawns training task |
| `stop_training` | `{ job_id? }` | Requests cooperative stop |
| `ping` | | Server replies `pong` |

### Server → Client (representative)

| `type` | Purpose |
|--------|---------|
| `job_started` | Includes `job_id` |
| `loading` | Status text |
| `dataset_loaded` | Train/test counts, `n_classes` |
| `batch_update` | Centralized incremental progress |
| `epoch_start` | Distributed: epoch + worker count |
| `epoch_complete` | Centralized/Distributed epoch summary |
| `worker_update` | Distributed per-worker loss |
| `round_start` | Federated round begin |
| `client_update` | Federated per-client training progress |
| `aggregating` | FedAvg step |
| `round_complete` | Federated round metrics + confusion matrix + comm cost |
| `training_complete` | Final `results` object |
| `error` | `message`, optional `traceback` |
| `pong` | Heartbeat response |

**Job correlation:** Messages include `job_id` except for connection-level events; the Zustand handler **does not filter by `job_id`** (single-session assumption).

---

## 12. REST API Reference

Base URL (dev): `http://localhost:8000`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Liveness |
| GET | `/docs` | OpenAPI UI |
| GET | `/api/training/presets` | Preset configurations |
| GET | `/api/training/status` | Placeholder status |
| GET | `/api/datasets/info/{ecg\|har}` | Dataset statistics |
| GET | `/api/datasets/samples/{ecg\|har}` | Sample waveforms/sequences |
| GET | `/api/datasets/partition/{ecg\|har}` | Federated partition stats |
| GET | `/api/metrics/comparison` | Mock cross-mode comparison |
| GET | `/api/metrics/default` | Mock scalar metrics |
| GET | `/api/models/list` | Available models per dataset |
| GET | `/api/models/info/{dataset}/{cnn\|lstm}` | Parameter counts, layer names |

---

## 13. Configuration and Defaults

### Backend defaults (`config.py` and route model defaults)

- Learning rate **0.001**, batch size **64**, epochs **15** (centralized/distributed).
- Federated: **5** clients, **10** rounds, **3** local epochs.
- ECG: **187** length, **5** classes.
- HAR: **128** × **9**, **6** classes.

### Frontend `TrainingConfig` component defaults

- Mirrors backend: `n_clients: 5`, `n_rounds: 10`, `local_epochs: 3`, `n_workers: 3`, `iid: true`, etc.
- Quick presets adjust clients/rounds/local epochs/epochs together.

### Hardcoded API URLs

- Frontend points to `http://localhost:8000` and `ws://localhost:8000` — **not** environment-driven in code.

---

## 14. Running the Application

### Prerequisites

- **Python 3.10+** with `pip`
- **Node.js** + npm (for Vite dev server)

### Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
```

- API: `http://localhost:8000`
- Docs: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

- App: `http://localhost:5173`

### Windows helpers

- `./start_backend.ps1` and `./start_frontend.ps1` at repo root.

### Production build (frontend)

```bash
cd frontend
npm run build
```

Static output in `frontend/dist/` (ignored by git).

---

## 15. Utilities, Metrics, and Supporting Code

### `utils/metrics.py`

- `compute_metrics` — accuracy, weighted/macro F1, precision, recall, confusion matrix, optional multiclass AUC, per-class F1.
- `compute_convergence_rate`, `compute_communication_efficiency` — helpers for analysis (not all wired into main training loop).

### `utils/signal_processing.py`

- Bandpass filter (Butterworth via SciPy), normalization, heart rate from RR intervals, simple feature vector for signals—supports future ECG analytics UI or preprocessing extensions.

### `utils/visualization_data.py`

- Formatters for Recharts: epoch curves, FL rounds, confusion matrix flattening, client metrics—usable if backend pre-formats data (currently much formatting happens on the client).

---

## 16. Evaluation Criteria and Pedagogical Alignment

The **About** page and README articulate alignment with typical federated learning coursework rubrics:

| Criterion | How FedMed addresses it |
|-----------|-------------------------|
| **Communication rounds** | Federated UI shows rounds, timeline, convergence per round |
| **Convergence** | Loss/accuracy/F1 per round; training curves |
| **Client participation** | All `n_clients` participate each round in simulation; topology + client grid |
| **Privacy preservation (conceptual)** | Data partitioned per client; only weights aggregated in FL mode—**simulated** |
| **Comparison across paradigms** | Dedicated pages + Comparison dashboard |

---

## 17. Privacy and Compliance Narrative

**In-app narrative** (e.g. Comparison page) describes federated learning as **not moving raw patient data** and references **GDPR** in a **general educational** sense.

**Engineering reality:** This is a **local demonstration**. There is no independent governance layer, threat model, audit log, or cryptographic protection of gradients. For real healthcare deployments, organizations would add **legal agreements**, **secure infrastructure**, **access control**, and often **DP/secure aggregation**—none of which are implemented here.

---

## 18. Limitations, Known Gaps, and Spec vs Code

| Topic | Spec / UI text | Actual code |
|-------|----------------|-------------|
| Flower framework | Mentioned in original prompt and sidebar footer | **`flwr` not in `requirements.txt`**; training uses **`FederatedSimulator`** |
| Socket.IO | In design doc | **Native WebSocket** only |
| shadcn/ui | In design doc | **Not** a listed dependency; custom/Tailwind/inline components |
| wfdb / PhysioNet | Design mentions wfdb | **Not** in `requirements.txt`; ECG real path is **CSV** |
| `GET /training/status` | Could reflect live jobs | **Static** response |
| HAR + LSTM | Factory supports `HARLSTMClassifier` | **`main.py` never selects it** for `har` + `lstm` |
| Federated result `iid` field | Should reflect config | **Hardcoded `True`** in `FederatedSimulator.run` return |
| Comparison convergence plot | “All 3 methods” | Uses **synthetic/random** curves for centralized/distributed unless extended; federated partially uses `roundHistory` |
| GPU | Automatic if CUDA available | **Single machine**; distributed is **not** multi-GPU cluster |
| Environment-based API URL | Production best practice | **Hardcoded localhost** |

---

## 19. Repository Layout

```
DML Jury/
├── README.md                          # Short overview + quick start
├── FEDMED_PROJECT_COMPLETE.md         # This document
├── cursor_prompt_federated_healthcare.md  # Original build specification (design reference)
├── start_backend.ps1
├── start_frontend.ps1
├── .gitignore
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── requirements.txt
│   ├── api/
│   │   ├── websocket.py
│   │   └── routes/
│   │       ├── training.py
│   │       ├── datasets.py
│   │       ├── metrics.py
│   │       └── models_router.py
│   ├── data/
│   │   ├── ecg_loader.py
│   │   ├── har_loader.py
│   │   └── dataset_manager.py
│   ├── models/
│   │   ├── cnn_ecg.py
│   │   ├── cnn_har.py
│   │   └── model_factory.py
│   ├── training/
│   │   ├── centralized.py
│   │   ├── distributed.py
│   │   └── federated.py          # Thin re-export of FederatedSimulator (main.py imports flower.simulation directly)
│   ├── flower/
│   │   ├── simulation.py         # FederatedSimulator (primary FL orchestration)
│   │   ├── client.py
│   │   └── server.py
│   └── utils/
│       ├── metrics.py
│       ├── signal_processing.py
│       └── visualization_data.py
└── frontend/
    ├── package.json
    ├── vite.config.ts (if present)
    ├── tailwind.config.js (if present)
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── pages/
        ├── components/
        ├── hooks/
        ├── store/
        ├── types/
        └── utils/
```

**Note:** `training/federated.py` only re-exports `FederatedSimulator`; `main.py` imports `from flower.simulation import FederatedSimulator` directly.

---

## 20. Glossary

| Term | Meaning in FedMed |
|------|-------------------|
| **FedAvg** | Federated Averaging—weighted average of client model parameters by sample count |
| **Client** | Logical holder of a data partition in simulation (e.g., “hospital” or “wearable”) |
| **Round** | One federated cycle: broadcast → local training → aggregate → evaluate |
| **Local epochs** | How many passes each client runs on its data per round |
| **IID** | Independent and identically distributed partition (uniform mix of labels) |
| **Non-IID** | Skewed label distribution per client |
| **AllReduce (simulated)** | Epoch-wise average of worker model parameters after local optimization |

---

## Document Maintenance

When you change the codebase, update this file if you:

- Add endpoints, message types, or datasets
- Switch from simulation to real Flower/PyTorch Distributed
- Wire `training/status` to real job tracking
- Fix `HAR` + `LSTM` selection in `main.py` or the `iid` field in federated results
- Introduce environment-based API configuration

---

*End of FedMed complete project documentation.*
