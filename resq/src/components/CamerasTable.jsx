import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/CamerasTable.css';
import '../styles/Modal.css';
import '../styles/CRUDButtons.css';

const CamerasTable = ({ cameras }) => {
  const [data, setData] = useState(cameras || []);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [lastActiveRange, setLastActiveRange] = useState([null, null]);
  const [lastActiveStart, lastActiveEnd] = lastActiveRange;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [newCamera, setNewCamera] = useState({
    name: '',
    location: '',
    status: 'online'
  });
  const [editCamera, setEditCamera] = useState({
    name: '',
    location: '',
    status: 'online'
  });
  const [errors, setErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});

  // Load from props or localStorage
  useEffect(() => {
    if (cameras && cameras.length) {
      setData(cameras);
      localStorage.setItem('cameras', JSON.stringify(cameras));
    } else {
      const stored = localStorage.getItem('cameras');
      if (stored) setData(JSON.parse(stored));
    }
  }, [cameras]);

  useEffect(() => {
    localStorage.setItem('cameras', JSON.stringify(data));
  }, [data]);

  // Update "online duration" every second
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prevData =>
        prevData.map(cam => {
          if (cam.status === 'online') {
            const last = new Date(cam.lastActive).getTime();
            const now = new Date().getTime();
            const diffMs = now - last;
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
            return {
              ...cam,
              onlineDuration: `${hours}h ${mins}m ${secs}s`
            };
          } else {
            // Keep previous onlineDuration if offline
            return { ...cam };
          }
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const generateNextCameraId = () => {
    const max = data.reduce((max, cam) => {
      const num = parseInt(cam.id?.replace('CAM-', '') || 0);
      return Math.max(max, num);
    }, 0);
    return `CAM-${String(max + 1).padStart(3, '0')}`;
  };

  const handleAddCamera = () => {
    const newErrors = {};
    if (!newCamera.name.trim()) newErrors.name = 'Name is required';
    if (!newCamera.location.trim()) newErrors.location = 'Location is required';
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    const camera = {
      id: generateNextCameraId(),
      ...newCamera,
      lastActive: new Date().toLocaleString(),
      onlineDuration: '0h 0m 0s' // start counter at 0
    };

    setData([camera, ...data]);
    setNewCamera({ name: '', location: '', status: 'online' });
    setErrors({});
    setIsAddModalOpen(false);
  };

  const handleStartEdit = (cam) => {
    setEditingId(cam.id);
    setEditCamera({
      name: cam.name || '',
      location: cam.location || '',
      status: cam.status || 'online'
    });
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  const handleUpdateCamera = () => {
    const newErrors = {};
    if (!editCamera.name.trim()) newErrors.name = 'Name is required';
    if (!editCamera.location.trim()) newErrors.location = 'Location is required';
    if (Object.keys(newErrors).length) {
      setEditErrors(newErrors);
      return;
    }

    const next = data.map((cam) => {
      if (cam.id !== editingId) return cam;

      const previousStatus = cam.status;
      const now = new Date().toLocaleString();

      if (previousStatus !== 'online' && editCamera.status === 'online') {
        return {
          ...cam,
          ...editCamera,
          lastActive: now,
          onlineDuration: '0h 0m 0s'
        };
      }

      return {
        ...cam,
        ...editCamera
      };
    });

    setData(next);
    setEditingId(null);
    setIsEditModalOpen(false);
  };

  const handleDeleteCamera = () => {
    if (!deleteTarget) return;
    const next = data.filter((cam) => cam.id !== deleteTarget.id);
    setData(next);
    setDeleteTarget(null);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setNewCamera({ name: '', location: '', status: 'online' });
    setErrors({});
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingId(null);
    setEditErrors({});
  };

  const parseLastActive = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const locationOptions = [...new Set(data.map((cam) => cam.location).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b)));

  const filtered = data.filter(cam => {
    const q = search.toLowerCase();
    const matchesSearch =
      (cam.id || '').toLowerCase().includes(q) ||
      (cam.name || '').toLowerCase().includes(q) ||
      (cam.location || '').toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === 'all' || cam.status === statusFilter;
    const matchesLocation =
      locationFilter === 'all' || cam.location === locationFilter;

    const lastActiveDate = parseLastActive(cam.lastActive);
    const rangeStart = lastActiveStart
      ? new Date(lastActiveStart.getFullYear(), lastActiveStart.getMonth(), lastActiveStart.getDate(), 0, 0, 0, 0)
      : null;
    const rangeEnd = lastActiveEnd
      ? new Date(lastActiveEnd.getFullYear(), lastActiveEnd.getMonth(), lastActiveEnd.getDate(), 23, 59, 59, 999)
      : null;

    const matchesLastActiveRange =
      (!rangeStart && !rangeEnd) ||
      (lastActiveDate && (!rangeStart || lastActiveDate >= rangeStart) && (!rangeEnd || lastActiveDate <= rangeEnd));

    return matchesSearch && matchesStatus && matchesLocation && matchesLastActiveRange;
  });

  return (
    <section className="dashboard-section history-section">
      <h2>Camera List</h2>

      <div className="cameras-controls">
        <input
          type="text"
          className="cameras-search"
          placeholder="Search cameras..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <select
          className="cameras-filter"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>

        <select
          className="cameras-filter"
          value={locationFilter}
          onChange={e => setLocationFilter(e.target.value)}
        >
          <option value="all">All Locations</option>
          {locationOptions.map((location) => (
            <option key={location} value={location}>{location}</option>
          ))}
        </select>

        <DatePicker
          selectsRange
          startDate={lastActiveStart}
          endDate={lastActiveEnd}
          onChange={(range) => setLastActiveRange(range)}
          isClearable
          placeholderText="Last Active range"
          className="cameras-filter"
          dateFormat="yyyy-MM-dd"
        />

        <div className="cameras-actions">
          <button className="btn btn-add" onClick={() => setIsAddModalOpen(true)}>
            Add Camera
          </button>
        </div>
      </div>

      <table className="cameras-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Location</th>
            <th>Status</th>
            <th>Last Active</th>
            <th>Online Duration</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filtered.length > 0 ? (
            filtered.map(cam => (
              <tr key={cam.id}>
                <td>{cam.id}</td>
                <td>{cam.name}</td>
                <td>{cam.location}</td>
                <td>
                  <span className={`camera-status ${cam.status}`}>
                    {cam.status}
                  </span>
                </td>
                <td>{cam.lastActive}</td>
                <td>{cam.status === 'online' ? cam.onlineDuration : '-'}</td>
                <td className="row-actions">
                  <button className="btn btn-edit" onClick={() => handleStartEdit(cam)}>
                    Edit
                  </button>
                  <button className="btn btn-delete" onClick={() => setDeleteTarget(cam)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="no-results">
                No cameras found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ADD CAMERA MODAL */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={closeAddModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add Camera</h3>

            <div className="modal-form-grid">
              <div className="field">
                <label>Name</label>
                <input
                  value={newCamera.name}
                  onChange={(e) =>
                    setNewCamera({ ...newCamera, name: e.target.value })
                  }
                />
                {errors.name && (
                  <div className="input-error">{errors.name}</div>
                )}
              </div>

              <div className="field">
                <label>Location</label>
                <input
                  value={newCamera.location}
                  onChange={(e) =>
                    setNewCamera({ ...newCamera, location: e.target.value })
                  }
                />
                {errors.location && (
                  <div className="input-error">{errors.location}</div>
                )}
              </div>

              <div className="field field-full">
                <label>Status</label>
                <select
                  value={newCamera.status}
                  onChange={(e) =>
                    setNewCamera({ ...newCamera, status: e.target.value })
                  }
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-add" onClick={handleAddCamera}>
                Save
              </button>
              <button
                className="btn"
                onClick={closeAddModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CAMERA MODAL */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Camera</h3>

            <div className="modal-form-grid">
              <div className="field">
                <label>Name</label>
                <input
                  value={editCamera.name}
                  onChange={(e) =>
                    setEditCamera({ ...editCamera, name: e.target.value })
                  }
                />
                {editErrors.name && (
                  <div className="input-error">{editErrors.name}</div>
                )}
              </div>

              <div className="field">
                <label>Location</label>
                <input
                  value={editCamera.location}
                  onChange={(e) =>
                    setEditCamera({ ...editCamera, location: e.target.value })
                  }
                />
                {editErrors.location && (
                  <div className="input-error">{editErrors.location}</div>
                )}
              </div>

              <div className="field field-full">
                <label>Status</label>
                <select
                  value={editCamera.status}
                  onChange={(e) =>
                    setEditCamera({ ...editCamera, status: e.target.value })
                  }
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-edit" onClick={handleUpdateCamera}>
                Save
              </button>
              <button className="btn" onClick={closeEditModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-content modal-confirm" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Camera</h3>
            <p>Delete camera {deleteTarget.id}? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-delete" onClick={handleDeleteCamera}>
                Delete
              </button>
              <button className="btn" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CamerasTable;