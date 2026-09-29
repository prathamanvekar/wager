# How to Setup and Run Wager

## Prerequisites
- **Node.js**: v18+ (tested on v22)
- **Python**: 3.10+ (tested on 3.12 / 3.14)
- No API keys, cloud accounts, or external services required.

---

## 1. Start the Backend API (FastAPI)

In the project root folder:

```bash
# Start backend server on port 8000
python -m uvicorn services.api.main:app --host 127.0.0.1 --port 8000 --reload
```

- **Health Endpoint**: `http://127.0.0.1:8000/api/v1/health`
- **Swagger Docs**: `http://127.0.0.1:8000/docs`

---

## 2. Start the Customer Web Portal (React + Vite)

In a new terminal:

```bash
# Navigate to web app
cd apps/web

# Install dependencies (first time only)
npm install

# Start local dev server on port 5173
npm run dev
```

- **Web Portal URL**: `http://localhost:5173/`

---

## 3. Run Automated Invariant Tests

In the project root folder:

```bash
python -m unittest discover tests
```

Verifies CJEP v1 event schema validation, orphan buffer retention, retroactive binding, and bitemporal AS-OF knowledge gap calculation.
