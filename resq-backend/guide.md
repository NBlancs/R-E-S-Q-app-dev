# Beginner Guide: Register, Login, and Use the RESQ APIs

This guide shows you how to:

1. Run the API server
2. Create a user (register)
3. Log in and get a token
4. Access protected endpoints
5. Create, read, update, and delete records

The examples use **PowerShell + HTTPie** on Windows.

## 1. Prerequisites

- You are in the project folder:
- Virtual environment exists at `.venv`
- Dependencies are installed (`django`, `djangorestframework`, `httpie`)

If not yet installed:

```powershell
cd C:\Users\bnoel\OneDrive\Desktop\programming\RESQ-django
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py seed_demo_data
```

## 2. Start the API Server

Run this in Terminal 1:

```powershell
cd C:\Users\bnoel\OneDrive\Desktop\programming\RESQ-django
.\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

If successful, you should see:

- `Starting development server at http://127.0.0.1:8000/`

## 3. Register a New User

Run this in Terminal 2:

```powershell
cd C:\Users\bnoel\OneDrive\Desktop\programming\RESQ-django
.\.venv\Scripts\http.exe --ignore-stdin --body POST http://127.0.0.1:8000/api/auth/register/ username=student email=student@example.com password=student123 role=bfp
```

Expected result:

- JSON response with a `token`
- `message` should say registration was successful

## 4. Login and Save Your Token

```powershell
$login = .\.venv\Scripts\http.exe --ignore-stdin --body POST http://127.0.0.1:8000/api/auth/login/ email=bfp@gmail.com password=bfp123
$token = ($login | ConvertFrom-Json).token
$token
```

Tip:

- If `$token` is empty, check email/password and try again.

You can also use seeded demo accounts:

- `admin@gmail.com / admin123`
- `bfp@gmail.com / bfp123`

## 5. Use Token to Access Protected Endpoints

All protected requests must include this header:

- `Authorization: Token <your_token>`

In PowerShell, use:

```powershell
"Authorization:Token $token"
```

### 5.1 Get Profile

```powershell
.\.venv\Scripts\http.exe --ignore-stdin GET http://127.0.0.1:8000/api/auth/profile/ "Authorization:Token $token"
```

### 5.2 Get System Overview

```powershell
.\.venv\Scripts\http.exe --ignore-stdin GET http://127.0.0.1:8000/api/system/overview/ "Authorization:Token $token"
```

## 6. Cameras API (CRUD)

### 6.1 Create Camera

```powershell
.\.venv\Scripts\http.exe --ignore-stdin POST http://127.0.0.1:8000/api/cameras/ "Authorization:Token $token" camera_code=CAM-010 name="Warehouse Cam" location="Zone D" status=online
```

Valid `status` values:

- `online`
- `offline`
- `maintenance`

### 6.2 List Cameras

```powershell
.\.venv\Scripts\http.exe --ignore-stdin GET http://127.0.0.1:8000/api/cameras/ "Authorization:Token $token"
```

### 6.3 Get One Camera by ID

```powershell
.\.venv\Scripts\http.exe --ignore-stdin GET http://127.0.0.1:8000/api/cameras/1/ "Authorization:Token $token"
```

### 6.4 Update Camera

```powershell
.\.venv\Scripts\http.exe --ignore-stdin PUT http://127.0.0.1:8000/api/cameras/1/ "Authorization:Token $token" camera_code=CAM-001 name="Entrance Gate Updated" location="Main Building" status=online footage_url="https://example.com/cam1.jpg"
```

### 6.5 Delete Camera

```powershell
.\.venv\Scripts\http.exe --ignore-stdin DELETE http://127.0.0.1:8000/api/cameras/10/ "Authorization:Token $token"
```

## 7. Incidents API (CRUD)

### 7.1 Create Incident

```powershell
.\.venv\Scripts\http.exe --ignore-stdin POST http://127.0.0.1:8000/api/incidents/ "Authorization:Token $token" incident_code=INC-010 incident_type=smoke location="Zone D - Storage" detection_method=camera_ai status=open camera:=1 notes="Smoke detected by camera AI"
```

Valid `incident_type` values:

- `fire`
- `gas`
- `smoke`
- `other`

Valid `detection_method` values:

- `heat_sensor`
- `camera_ai`
- `gas_sensor`
- `manual`

Valid `status` values:

- `open`
- `investigating`
- `resolved`

### 7.2 List Incidents

```powershell
.\.venv\Scripts\http.exe --ignore-stdin GET http://127.0.0.1:8000/api/incidents/ "Authorization:Token $token"
```

### 7.3 Get One Incident by ID

```powershell
.\.venv\Scripts\http.exe --ignore-stdin GET http://127.0.0.1:8000/api/incidents/1/ "Authorization:Token $token"
```

### 7.4 Update Incident

```powershell
.\.venv\Scripts\http.exe --ignore-stdin PUT http://127.0.0.1:8000/api/incidents/1/ "Authorization:Token $token" incident_code=INC-001 incident_type=fire location="Zone A - North" detection_method=heat_sensor status=resolved camera:=1 notes="Resolved by response team"
```

### 7.5 Delete Incident

```powershell
.\.venv\Scripts\http.exe --ignore-stdin DELETE http://127.0.0.1:8000/api/incidents/10/ "Authorization:Token $token"
```

## 8. Common Errors and Fixes

- `401 Unauthorized`
  - Missing or invalid token
  - Re-login and use `"Authorization:Token $token"`

- `400 Bad Request`
  - Missing required fields or invalid choice values
  - Check allowed values in sections 6 and 7

- `Connection refused`
  - Server not running
  - Start server again in Terminal 1

- `http.exe not found`
  - Use full path:
  - `.\.venv\Scripts\http.exe`

## 9. Quick End-to-End Test

Copy and run this in Terminal 2 after server is running:

```powershell
$login = .\.venv\Scripts\http.exe --ignore-stdin --body POST http://127.0.0.1:8000/api/auth/login/ email=admin@gmail.com password=admin123
$token = ($login | ConvertFrom-Json).token
.\.venv\Scripts\http.exe --ignore-stdin GET http://127.0.0.1:8000/api/auth/profile/ "Authorization:Token $token"
.\.venv\Scripts\http.exe --ignore-stdin GET http://127.0.0.1:8000/api/cameras/ "Authorization:Token $token"
.\.venv\Scripts\http.exe --ignore-stdin GET http://127.0.0.1:8000/api/incidents/ "Authorization:Token $token"
.\.venv\Scripts\http.exe --ignore-stdin GET http://127.0.0.1:8000/api/system/overview/ "Authorization:Token $token"
```

If all four GET requests return JSON data, your API is working correctly.
