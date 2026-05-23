# FedShield — Federated Learning Attack Monitor

A real-time dashboard that monitors federated learning rounds between hospital clients, detects poisoned model updates, and identifies the guilty client using cryptographic signatures.

---

## How It Works

```
Google Colab (your FL model)
        │
        │  HTTP via ngrok
        ▼
FastAPI Backend (your laptop)
        │
        │  HTTP polling
        ▼
React Frontend (your browser)
```

Your FL model runs on Google Colab as usual. When it detects an attack, it sends the results to the FastAPI backend on your laptop. The React frontend polls the backend and displays everything live.

---

## Prerequisites

Make sure you have these installed before starting:

| Tool | Download |
|------|----------|
| Python 3.10+ | https://python.org/downloads |
| Node.js (LTS) | https://nodejs.org |
| ngrok | https://ngrok.com |
| Git | https://git-scm.com |

> During Python install on Windows — tick **"Add Python to PATH"**

---

## One-Time Setup

### 1. Clone the repo

```bash
git clone https://github.com/YOURNAME/fl-dashboard.git
cd fl-dashboard
```

### 2. Set up the backend

```bash
cd backend
pip install fastapi uvicorn
```

### 3. Set up the frontend

```bash
cd frontend
npm install
```

### 4. Set up ngrok

- Go to https://ngrok.com and create a free account
- Go to https://dashboard.ngrok.com/get-started/setup
- Download ngrok for your OS and run:

```bash
ngrok config add-authtoken YOUR_TOKEN_HERE
```

Your token is shown on the ngrok dashboard after signing in.

### 5. Get the Colab notebook

The `deploy.ipynb` file will be shared with you separately via Google Drive.

- Open the shared link
- Click **File → Save a copy in Drive**
- It will save to your own Google Drive

---

## Every Time You Run The Project

You need **3 terminals open at the same time.**

### Terminal 1 — Start the backend

```bash
cd fl-dashboard/backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
Uvicorn running on http://0.0.0.0:8000
Application startup complete.
```

### Terminal 2 — Start the frontend

```bash
cd fl-dashboard/frontend
npm run dev
```

You should see:
```
VITE ready on http://localhost:5173
```

### Terminal 3 — Start ngrok

```bash
ngrok http 8000
```

You will see something like:
```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:8000
```

**Copy that `https://abc123.ngrok-free.app` URL — you need it in the next step.**

> ⚠️ ngrok gives you a new URL every time you restart it. You must update the Colab notebook with the new URL each time.

---

## Setting Up The Colab Notebook

1. Open `deploy.ipynb` from your Google Drive in Google Colab
2. Scroll to the **very last cell** (the FedShield Reporter cell)
3. Find this line at the top:

```python
BACKEND_URL = "https://your-old-url.ngrok-free.app"
```

4. Replace it with your current ngrok URL:

```python
BACKEND_URL = "https://abc123.ngrok-free.app"
```

5. **Test the connection** — add a temporary cell and run:

```python
import requests
try:
    r = requests.get(f"{BACKEND_URL}/health",
                     headers={"ngrok-skip-browser-warning": "true"},
                     timeout=5)
    print("✅ Connected!", r.json())
except Exception as e:
    print("❌ Failed:", e)
```

You should see `✅ Connected! {'status': 'ok'}` before running the full model.

---

## Running The Full Project

Once all 3 terminals are running and the connection test passes:

**In Colab** — run all cells from top to bottom. The last reporter cell will automatically send results to your backend.

You should see in Colab:
```
[FedShield] ✅ Backend notified — round started
[FedShield] 📡 Live log pusher started (every 5s)
[FedShield] ⏳ Waiting for FL processes to finish...
[FedShield] ✅ All FL processes finished
[FedShield] ✅ Round complete!
[FedShield] 🔍 Guilty client: hospital2
```

**In your browser** — open http://localhost:5173

1. Click **Hospital 1** to connect it to the server
2. Click **Hospital 2** to connect it to the server
3. Click **Start Federation Round**
4. Watch the network diagram light up live

---

## What The Dashboard Shows

| Element | Meaning |
|---------|---------|
| 🟢 Green node | Connected and clean |
| 🟡 Amber node | GM is processing |
| 🔴 Red node | Attack detected / guilty client |
| Animated lines | Live data flowing between nodes |
| Terminal boxes | Live log output from each process |
| Round breakdown | Per-round loss and accuracy |
| Verdict card | Which hospital sent poisoned data |

---

## Project Structure

```
fl-dashboard/
├── frontend/
│   └── src/
│       ├── App.jsx                  ← root layout
│       ├── components/
│       │   ├── Landing.jsx          ← hero landing page
│       │   ├── Dashboard.jsx        ← network diagram + metrics
│       │   ├── Node.jsx             ← individual network node
│       │   ├── ConnectionLine.jsx   ← animated SVG lines
│       │   ├── Terminal.jsx         ← log output box
│       │   └── MetricCard.jsx       ← stat card
│       └── hooks/
│           └── useFederation.js     ← all state + backend polling
│
├── backend/
│   ├── main.py                      ← FastAPI routes
│   ├── parser.py                    ← log parsing logic
│   ├── state.py                     ← shared in-memory state
│   └── models.py                    ← request/response shapes
│
└── README.md
```

---

## Troubleshooting

**Frontend shows demo/fake data**
> Colab didn't reach the backend. Check your ngrok URL is correct in the reporter cell and that all 3 terminals are running.

**`❌ Could not reach backend` in Colab**
> Your ngrok URL has changed. Restart ngrok, copy the new URL, update `BACKEND_URL` in the reporter cell.

**`ERR_NGROK_8012` in browser**
> You ran `ngrok http` without the port number. Run `ngrok http 8000` not just `ngrok http`.

**Backend shows no POST requests**
> Colab is still using your old local IP instead of the ngrok URL. Double check the reporter cell has `https://...ngrok-free.app` not `http://192.168.x.x`.

**`npm run dev` fails**
> Run `npm install` first inside the `frontend/` folder.

**`uvicorn: command not found`**
> Run `pip install fastapi uvicorn` first inside the `backend/` folder.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Backend | FastAPI + Python |
| Tunnel | ngrok |
| FL Framework | Flower (flwr) |
| ML | PyTorch |
| Crypto | ECDSA (secp256r1) |

---

## Important Notes

- `deploy.ipynb` is **not in this repo** — it contains the private FL model. It will be shared separately.
- Never commit `.pkl`, `.pem`, or any key files to GitHub.
- The ngrok free tier gives a new URL every restart — always update `BACKEND_URL` in Colab.