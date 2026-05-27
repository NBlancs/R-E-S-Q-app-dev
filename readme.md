# R.E.S.Q. App Dev

R.E.S.Q. is a fire detection and incident monitoring system with three active parts in this workspace:

- `resq/` - React + Vite frontend dashboard
- `resq-backend/` - Django REST Framework API for cameras, incidents, auth, and overview data
- `ml_backend/` - FastAPI + YOLOv8 inference service for image-based fire detection

## Current Features

Frontend:

- Login screen and protected dashboard flow
- Overview dashboard with summary cards, alerts, incidents, and system status
- Camera panel with webcam support and ESP32-CAM support
- ESP32 preview modes for direct stream loading or browser CORS capture
- Incident map, camera list, reports, and profile pages

Backend:

- Camera CRUD
- Incident CRUD
- Authentication endpoints
- System overview endpoint
- SQLite-backed local development setup

ML service:

- `POST /detect/base64` for webcam and browser-captured frames
- `POST /detect/url` for ESP32 snapshot URLs and stream-to-snapshot fallback
- YOLOv8 model loading from `ml_backend/best.pt`

## Problem Statement

Fire response times in Cagayan De Oro City frequently exceed the 7-minute target because of late incident reporting, reliance on manual phone hotlines, and logistical challenges.

## Target Users

- Industries susceptible to gas leakage and fire disasters
- Fire responders (BFP)
- Local government units (LGUs)
- System administrators

## Project Structure

```text
readme.md
ml_backend/
  main.py
  best.pt
  requirements.txt
resq/
  src/
    components/
    dashboard/
    login/
    pages/
    services/
    styles/
  package.json
resq-backend/
  manage.py
  api/
  backend_config/
  requirements.txt
  db.sqlite3
```

## Local Setup

### 1. Frontend

```bash
cd resq
npm install
npm run dev
```

The Vite app runs on `http://localhost:5173`.

### 2. Django API

```bash
cd resq-backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo_data
python manage.py runserver 127.0.0.1:8000
```

### 3. ML Inference Service

```bash
cd ml_backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py
```

The FastAPI service runs on `http://127.0.0.1:8001`.

## Useful Environment Variables

Frontend:

- `VITE_ML_API_URL`
- `VITE_ESP32_STREAM_URL`
- `VITE_ESP32_SNAPSHOT_URL`
- `VITE_FIRE_LOCATION_NAME`
- `VITE_FIRE_LATITUDE`
- `VITE_FIRE_LONGITUDE`

Backend:

- `SECRET_KEY`
- `DEBUG`
- `ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`

## Main API Endpoints

Django API base: `http://127.0.0.1:8000/api/`

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `GET /api/auth/profile/`
- `GET|POST /api/cameras/`
- `GET|PUT|DELETE /api/cameras/{id}/`
- `GET|POST /api/incidents/`
- `GET|PUT|DELETE /api/incidents/{id}/`
- `GET /api/system/overview/`

ML API base: `http://127.0.0.1:8001`

- `GET /`
- `GET /health`
- `POST /detect/base64`
- `POST /detect/url`

## Notes

- The ESP32 camera panel can use a direct browser stream or a backend snapshot fetch depending on the CORS toggle.
- The FastAPI service expects `ml_backend/best.pt` to be present.
- The Django backend uses SQLite for local development and can be seeded with demo data after migrations.
