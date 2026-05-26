import { useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { fetchIncidents, updateIncident } from '../services/api';
import { toFrontendIncident } from '../services/mappers';
import '../styles/IncidentMap.css';
import '../styles/IncidentsTable.css';

const defaultIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

const DEFAULT_CENTER = [8.4542, 124.6319];

const toDateValue = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatIncidentTimestamp = (incident) => {
  const dateValue = toDateValue(`${incident.date}T${incident.time || '00:00'}:00`);

  if (!dateValue) {
    return 'Unknown time';
  }

  return dateValue.toLocaleString();
};

const buildFirePinIcon = (status) => L.divIcon({
  className: '',
  html: `
    <div class="fire-pin-marker fire-pin-marker--${status === 'resolved' ? 'resolved' : 'active'}">
      <span class="fire-pin-marker__flame" aria-hidden="true">🔥</span>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 38],
  popupAnchor: [0, -34],
});

const IncidentMap = () => {
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [resolvingIds, setResolvingIds] = useState(new Set());
  const mapRef = useRef(null);

  const loadIncidents = async () => {
    try {
      const response = await fetchIncidents();
      const nextIncidents = Array.isArray(response) ? response.map(toFrontendIncident) : [];
      setIncidents(nextIncidents);
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'Unable to load fire pins.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const refresh = async () => {
      if (!isMounted) {
        return;
      }

      await loadIncidents();
    };

    refresh();
    const intervalId = window.setInterval(refresh, 15000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const firePins = incidents.filter((incident) => (
    Number.isFinite(incident.latitude)
    && Number.isFinite(incident.longitude)
    && incident.status !== 'resolved'
  ));

  const handleLocateIncident = (incident) => {
    if (mapRef.current && Number.isFinite(incident.latitude) && Number.isFinite(incident.longitude)) {
      mapRef.current.flyTo([incident.latitude, incident.longitude], Math.max(mapRef.current.getZoom(), 15), {
        animate: true,
      });
    }
  };

  const handleResolveIncident = async (incident) => {
    const incidentId = incident.backendId;

    setResolvingIds((prev) => {
      const next = new Set(prev);
      next.add(incidentId);
      return next;
    });
    setError('');

    try {
      await updateIncident(incidentId, { status: 'resolved' });
      setIncidents((prev) => prev.map((item) => (
        item.backendId === incidentId ? { ...item, status: 'resolved' } : item
      )));
    } catch (resolveError) {
      setError(resolveError.message || 'Unable to mark the fire as extinguished.');
    } finally {
      setResolvingIds((prev) => {
        const next = new Set(prev);
        next.delete(incidentId);
        return next;
      });
    }
  };

  return (
    <div className="incident-map-container">
      <div className="incident-map-header">
        <h2>BFP Fire Map</h2>
        <p className="incident-map-subtitle">
          {firePins.length} persisted fire pin{firePins.length === 1 ? '' : 's'} tracked from confirmed detections.
        </p>
      </div>

      <div className="incident-map-view">
        <MapContainer
          whenReady={(event) => {
            mapRef.current = event.target;
          }}
          center={DEFAULT_CENTER}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {firePins.map((incident) => (
            <Marker
              key={incident.backendId}
              position={[incident.latitude, incident.longitude]}
              icon={buildFirePinIcon(incident.status)}
              eventHandlers={{
                click: () => handleLocateIncident(incident),
              }}
            >
              <Tooltip direction="top" offset={[0, -18]} opacity={1}>
                <strong>{incident.location}</strong>
                <br />
                {incident.status === 'resolved' ? 'Resolved' : 'Active'} fire pin
              </Tooltip>
              <Popup className="fire-pin-popup">
                <div className="fire-pin-popup__content">
                  <h3>{incident.location}</h3>
                  <p><strong>Reported:</strong> {formatIncidentTimestamp(incident)}</p>
                  <p><strong>Confidence:</strong> {(incident.confidence * 100).toFixed(1)}%</p>
                  <p><strong>Status:</strong> {incident.status}</p>
                  <p><strong>Coordinates:</strong> {incident.latitude.toFixed(5)}, {incident.longitude.toFixed(5)}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {isLoading && <div className="map-placeholder-text">Loading fire pins...</div>}
        {!isLoading && firePins.length === 0 && (
          <div className="map-placeholder-text">No fire pins recorded yet</div>
        )}
      </div>

      {error && <p className="incident-map-error">{error}</p>}

      <div className="ping-list">
        <table className="incidents-table ping-table">
          <thead>
            <tr>
              <th>Location</th>
              <th>Timestamp</th>
              <th>Confidence</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {firePins.length === 0 ? (
              <tr>
                <td colSpan="5">No persisted fire detections yet.</td>
              </tr>
            ) : (
              firePins.map((incident) => (
                <tr key={incident.backendId}>
                  <td>{incident.location}</td>
                  <td>{formatIncidentTimestamp(incident)}</td>
                  <td>{(incident.confidence * 100).toFixed(1)}%</td>
                  <td>
                    <span className={`fire-status-badge fire-status-badge--${incident.status}`}>
                      {incident.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-show" onClick={() => handleLocateIncident(incident)}>
                      Show
                    </button>
                    <button
                      className="btn btn-extinguish"
                      onClick={() => handleResolveIncident(incident)}
                      disabled={resolvingIds.has(incident.backendId)}
                    >
                      Fire extinguished
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IncidentMap;
