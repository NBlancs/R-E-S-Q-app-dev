# RESQ Django Backend (DRF)

Separate backend repository for the R.E.S.Q system, implemented with Django REST Framework.

## What This Backend Covers

- DRF backend aligned with the existing RESQ web and mobile features
- Real system models:
  - `Camera`
  - `Incident`
  - `UserProfile` (role support for admin/BFP)
- Authentication system:
  - Register endpoint
  - Login endpoint
  - Token-based protected APIs
- Feature APIs (working endpoints):
  - Cameras CRUD
  - Incidents CRUD
  - System overview summary
- API tested using HTTPie

## Tech Stack

- Django
- Django REST Framework
- DRF Token Authentication
- SQLite
- django-cors-headers

## Project Structure

- `backend_config/` - Django project settings and root URL config
- `api/` - Models, serializers, views, URLs, admin registration
- `api/management/commands/seed_demo_data.py` - Demo data seeder
- `docs/` - HTTPie test evidence and screenshot instructions

## Setup

1. Create and activate virtual environment (already committed structure assumes `.venv`):

   - Windows PowerShell:
     - `python -m venv .venv`
     - `.\.venv\Scripts\Activate.ps1`

2. Install dependencies:

   - `pip install -r requirements.txt`

3. Run migrations:

   - `python manage.py migrate`

4. Seed demo data:

   - `python manage.py seed_demo_data`

5. Run server:

   - `python manage.py runserver 127.0.0.1:8000`

## API Base URL

- `http://127.0.0.1:8000/api/`

## Main Endpoints

### Authentication

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `GET /api/auth/profile/` (requires token)

### Cameras

- `GET /api/cameras/`
- `POST /api/cameras/`
- `GET /api/cameras/{id}/`
- `PUT /api/cameras/{id}/`
- `DELETE /api/cameras/{id}/`

### Incidents

- `GET /api/incidents/`
- `POST /api/incidents/`
- `GET /api/incidents/{id}/`
- `PUT /api/incidents/{id}/`
- `DELETE /api/incidents/{id}/`

### System Summary

- `GET /api/system/overview/`

## Authentication Header

Use DRF token auth:

- `Authorization: Token <your_token>`

## HTTPie Test Proof

See:

- `docs/httpie_test_results.md`

## Screenshot Proof

Place your running API screenshot in:

- `docs/running-api-proof.png`

Instructions:

- `docs/screenshot_instructions.md`
