import { useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
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

const PingModal = ({
  isOpen,
  mode = 'view',
  coords,
  name,
  description,
  onClose,
  onSave,
  onRemove,
  onNameChange,
  onDescriptionChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        {mode === 'add' ? (
          <>
            <h3>Add Ping</h3>
            <p>Coordinates: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p>

            <div className="modal-form-grid">
              <div className="field">
                <label>Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => onNameChange && onNameChange(event.target.value)}
                />
              </div>
              <div className="field">
                <label>Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(event) => onDescriptionChange && onDescriptionChange(event.target.value)}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-add" onClick={onSave}>Save</button>
              <button className="btn btn-cancel" onClick={onClose}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <h3>Ping Details</h3>
            <p>Name: {name || '—'}</p>
            <p>Coordinates: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p>
            <p>Description: {description || '—'}</p>

            <div className="modal-actions">
              <button className="btn" onClick={onClose}>Close</button>
              {onRemove && (
                <button className="btn btn-delete" onClick={onRemove}>Remove</button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const PingList = ({ markers = [], onLocate, onRemove }) => {
  if (markers.length === 0) {
    return <p className="no-pings">No pings yet</p>;
  }

  return (
    <div className="ping-list">
      <table className="incidents-table ping-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Coordinates</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {markers.map((marker) => (
            <tr key={marker.id}>
              <td>{marker.name || '-'}</td>
              <td>{marker.description || '-'}</td>
              <td>{marker.lat.toFixed(3)}, {marker.lng.toFixed(3)}</td>
              <td>
                <button className="btn btn-show" onClick={() => onLocate(marker)}>Show</button>
                <button className="btn btn-delete" onClick={() => onRemove(marker)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const IncidentMap = () => {
  const [markers, setMarkers] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalCoords, setModalCoords] = useState(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedMarker, setSelectedMarker] = useState(null);

  const mapRef = useRef(null);

  const MapClickHandler = () => {
    useMapEvents({
      click(event) {
        setModalCoords(event.latlng);
        setNewName('');
        setNewDescription('');
        setIsAddModalOpen(true);
      },
    });

    return null;
  };

  const handleAddMarker = () => {
    if (!modalCoords) {
      return;
    }

    const newMarker = {
      id: Date.now(),
      lat: modalCoords.lat,
      lng: modalCoords.lng,
      name: newName,
      description: newDescription,
    };

    setMarkers((prev) => [...prev, newMarker]);
    setIsAddModalOpen(false);
    setModalCoords(null);
  };

  const handleLocateMarker = (marker) => {
    if (mapRef.current) {
      mapRef.current.setView([marker.lat, marker.lng], mapRef.current.getZoom());
    }

    setSelectedMarker(marker);
  };

  const handleRemoveMarker = (marker) => {
    setMarkers((prev) => prev.filter((item) => item.id !== marker.id));

    if (selectedMarker && selectedMarker.id === marker.id) {
      setSelectedMarker(null);
    }
  };

  return (
    <div className="incident-map-container">
      <div className="incident-map-header">
        <h2>Live Incident Map</h2>
      </div>

      <div className="incident-map-view">
        <MapContainer
          whenReady={(event) => {
            mapRef.current = event.target;
          }}
          center={[8.4542, 124.6319]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler />

          {markers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              eventHandlers={{
                click: () => setSelectedMarker(marker),
              }}
            />
          ))}
        </MapContainer>
      </div>

      <PingList
        markers={markers}
        onLocate={handleLocateMarker}
        onRemove={handleRemoveMarker}
      />

      <PingModal
        isOpen={isAddModalOpen}
        mode="add"
        coords={modalCoords || { lat: 0, lng: 0 }}
        name={newName}
        description={newDescription}
        onClose={() => setIsAddModalOpen(false)}
        onNameChange={setNewName}
        onDescriptionChange={setNewDescription}
        onSave={handleAddMarker}
      />

      <PingModal
        isOpen={!!selectedMarker}
        mode="view"
        coords={selectedMarker || { lat: 0, lng: 0 }}
        name={selectedMarker?.name}
        description={selectedMarker?.description}
        onClose={() => setSelectedMarker(null)}
        onRemove={() => selectedMarker && handleRemoveMarker(selectedMarker)}
      />
    </div>
  );
};

export default IncidentMap;
