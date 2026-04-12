# HTTPie API Test Results

Server used:

- `http://127.0.0.1:8000`

## 1. Login (Token Retrieval)

Command:

```bash
http --ignore-stdin --body POST http://127.0.0.1:8000/api/auth/login/ email=admin@gmail.com password=admin123
```

Result:

- Received token successfully

## 2. Get Profile (Authenticated)

Command:

```bash
http --ignore-stdin GET http://127.0.0.1:8000/api/auth/profile/ "Authorization:Token <TOKEN>"
```

Result snapshot:

```json
{
  "avatar": "",
  "email": "admin@gmail.com",
  "role": "admin",
  "username": "admin"
}
```

## 3. List Cameras (Authenticated)

Command:

```bash
http --ignore-stdin GET http://127.0.0.1:8000/api/cameras/ "Authorization:Token <TOKEN>"
```

Result:

- Returned camera records (`CAM-001`, `CAM-002`, `CAM-003`)

## 4. List Incidents (Authenticated)

Command:

```bash
http --ignore-stdin GET http://127.0.0.1:8000/api/incidents/ "Authorization:Token <TOKEN>"
```

Result:

- Returned incident records (`INC-001`, `INC-002`)

## 5. Register New User

Command:

```bash
http --ignore-stdin --body POST http://127.0.0.1:8000/api/auth/register/ email=student@example.com password=student123 role=bfp
```

Result:

- Created user and returned token

## 6. Create Camera (POST)

Command:

```bash
http --ignore-stdin POST http://127.0.0.1:8000/api/cameras/ "Authorization:Token <REGISTER_TOKEN>" camera_code=CAM-004 name="Warehouse Cam" location="Zone D" status=online
```

Result snapshot:

```json
{
  "camera_code": "CAM-004",
  "id": 4,
  "location": "Zone D",
  "name": "Warehouse Cam",
  "status": "online"
}
```

## 7. Create Incident (POST)

Command:

```bash
http --ignore-stdin POST http://127.0.0.1:8000/api/incidents/ "Authorization:Token <REGISTER_TOKEN>" incident_code=INC-003 incident_type=smoke location="Zone D - Storage" detection_method=camera_ai status=open camera:=4 notes="Smoke detected by camera AI"
```

Result snapshot:

```json
{
  "incident_code": "INC-003",
  "incident_type": "smoke",
  "status": "open",
  "camera": 4,
  "reported_by_username": "student"
}
```

## 8. System Overview

Command:

```bash
http --ignore-stdin GET http://127.0.0.1:8000/api/system/overview/ "Authorization:Token <TOKEN>"
```

Result snapshot:

```json
{
  "camera_count": 3,
  "incident_count": 2,
  "open_incidents": 1,
  "resolved_incidents": 1
}
```

Notes:

- Commands above were executed successfully against this backend.
- Replace `<TOKEN>` and `<REGISTER_TOKEN>` with actual token values from your run.
