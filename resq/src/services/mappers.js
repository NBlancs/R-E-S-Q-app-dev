const INCIDENT_TYPE_LABELS = {
  fire: 'Fire',
  gas: 'Gas',
  smoke: 'Smoke',
  other: 'Other',
}

const INCIDENT_TYPE_VALUES = {
  fire: 'fire',
  gas: 'gas',
  smoke: 'smoke',
  other: 'other',
}

const INCIDENT_METHOD_LABELS = {
  heat_sensor: 'Heat Sensor',
  camera_ai: 'Camera AI',
  gas_sensor: 'Gas Sensor',
  manual: 'Manual',
}

const INCIDENT_METHOD_VALUES = {
  heat_sensor: 'heat_sensor',
  camera_ai: 'camera_ai',
  gas_sensor: 'gas_sensor',
  manual: 'manual',
}

const TYPE_FROM_LABEL = Object.fromEntries(
  Object.entries(INCIDENT_TYPE_LABELS).map(([value, label]) => [label.toLowerCase(), value]),
)

const METHOD_FROM_LABEL = Object.fromEntries(
  Object.entries(INCIDENT_METHOD_LABELS).map(([value, label]) => [label.toLowerCase(), value]),
)

const pad = (value) => String(value).padStart(2, '0')

const formatDatePart = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const formatTimePart = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`

const parseIncidentCodeNumber = (code) => {
  const normalizedCode = String(code || '').replace('#', '').trim()
  const match = normalizedCode.match(/(\d+)/)
  return match ? Number(match[1]) : 0
}

const toDate = (value) => {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const formatAlertTime = (value) => {
  const parsed = toDate(value)

  if (!parsed) {
    return ''
  }

  return parsed.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const toFrontendAlert = (alert) => ({
  backendId: alert.id,
  id: alert.id,
  eventId: alert.event_id || '',
  title: alert.title,
  location: alert.location,
  time: formatAlertTime(alert.time || alert.created_at),
  priority: alert.priority || 'medium-priority',
  confidence: Number(alert.confidence || 0),
  isRead: Boolean(alert.acknowledged),
  isDismissed: Boolean(alert.dismissed),
})

export const toFrontendCamera = (camera) => {
  const lastActiveDate = toDate(camera.last_active)

  return {
    backendId: camera.id,
    id: camera.camera_code,
    cameraCode: camera.camera_code,
    name: camera.name,
    location: camera.location,
    status: camera.status,
    lastActive: lastActiveDate ? lastActiveDate.toLocaleString() : '',
    lastActiveRaw: camera.last_active,
    footageUrl: camera.footage_url || '',
  }
}

export const buildNextCameraCode = (cameras) => {
  const maxCode = cameras.reduce((max, camera) => Math.max(max, parseIncidentCodeNumber(camera.cameraCode || camera.id)), 0)
  return `CAM-${String(maxCode + 1).padStart(3, '0')}`
}

export const toFrontendIncident = (incident) => {
  const reportedAt = toDate(incident.time_reported)

  return {
    backendId: incident.id,
    eventId: incident.event_id || '',
    incidentCode: incident.incident_code,
    id: `#${incident.incident_code}`,
    type: INCIDENT_TYPE_LABELS[incident.incident_type] || incident.incident_type,
    location: incident.location,
    method: INCIDENT_METHOD_LABELS[incident.detection_method] || incident.detection_method,
    time: reportedAt ? formatTimePart(reportedAt) : '',
    date: reportedAt ? formatDatePart(reportedAt) : '',
    status: incident.status,
    camera: incident.camera,
    notes: incident.notes || '',
    latitude: incident.latitude === null || incident.latitude === undefined ? null : Number(incident.latitude),
    longitude: incident.longitude === null || incident.longitude === undefined ? null : Number(incident.longitude),
    confidence: Number(incident.confidence || 0),
  }
}

export const buildNextIncidentCode = (incidents) => {
  const maxCode = incidents.reduce((max, incident) => Math.max(max, parseIncidentCodeNumber(incident.incidentCode || incident.id)), 0)
  return `INC-${String(maxCode + 1).padStart(3, '0')}`
}

const normalizeIncidentType = (type) => {
  const normalized = String(type || '').trim().toLowerCase()
  return INCIDENT_TYPE_VALUES[normalized] || TYPE_FROM_LABEL[normalized] || 'other'
}

const normalizeIncidentMethod = (method) => {
  const normalized = String(method || '').trim().toLowerCase()
  return INCIDENT_METHOD_VALUES[normalized] || METHOD_FROM_LABEL[normalized] || 'manual'
}

const normalizeIncidentStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase()
  if (['open', 'investigating', 'resolved'].includes(normalized)) {
    return normalized
  }

  return 'investigating'
}

const buildTimeReported = (dateValue, timeValue) => {
  const safeDate = dateValue || formatDatePart(new Date())
  const safeTime = timeValue || '00:00'
  const isoCandidate = `${safeDate}T${safeTime}:00`
  const parsed = new Date(isoCandidate)

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString()
  }

  return new Date().toISOString()
}

export const toBackendIncidentPayload = (incident, fallbackIncidentCode) => ({
  incident_code: (incident.incidentCode || incident.id || fallbackIncidentCode || '').replace('#', ''),
  incident_type: normalizeIncidentType(incident.type),
  location: incident.location,
  detection_method: normalizeIncidentMethod(incident.method),
  time_reported: buildTimeReported(incident.date, incident.time),
  status: normalizeIncidentStatus(incident.status),
  camera: incident.camera || null,
  notes: incident.notes || '',
})
