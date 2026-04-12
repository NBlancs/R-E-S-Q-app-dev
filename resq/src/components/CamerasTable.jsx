import { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/CamerasTable.css';
import '../styles/Modal.css';
import '../styles/CRUDButtons.css';

const EMPTY_CAMERA_FORM = {
  name: '',
  location: '',
  status: 'online',
};

const toDateValue = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildOnlineDuration = (lastActive) => {
  const dateValue = toDateValue(lastActive);

  if (!dateValue) {
    return '-';
  }

  const elapsedMilliseconds = Date.now() - dateValue.getTime();
  const hours = Math.floor(elapsedMilliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((elapsedMilliseconds % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((elapsedMilliseconds % (1000 * 60)) / 1000);

  return `${hours}h ${minutes}m ${seconds}s`;
};

const CamerasTable = ({
  cameras = [],
  isLoading = false,
  error = '',
  onCreateCamera,
  onUpdateCamera,
  onDeleteCamera,
}) => {
  const [data, setData] = useState(cameras);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [lastActiveRange, setLastActiveRange] = useState([null, null]);
  const [lastActiveStart, lastActiveEnd] = lastActiveRange;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [newCamera, setNewCamera] = useState(EMPTY_CAMERA_FORM);
  const [editCamera, setEditCamera] = useState(EMPTY_CAMERA_FORM);
  const [errors, setErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setData(cameras);
  }, [cameras]);

  useEffect(() => {
    const interval = setInterval(() => {
      setData((previousData) => previousData.map((camera) => {
        if (camera.status !== 'online') {
          return camera;
        }

        return {
          ...camera,
          onlineDuration: buildOnlineDuration(camera.lastActiveRaw || camera.lastActive),
        };
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const locationOptions = [...new Set(data.map((camera) => camera.location).filter(Boolean))]
    .sort((left, right) => String(left).localeCompare(String(right)));

  const filtered = data.filter((camera) => {
    const query = search.toLowerCase();
    const matchesSearch =
      (camera.id || '').toLowerCase().includes(query)
      || (camera.name || '').toLowerCase().includes(query)
      || (camera.location || '').toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'all' || camera.status === statusFilter;
    const matchesLocation = locationFilter === 'all' || camera.location === locationFilter;

    const lastActiveDate = toDateValue(camera.lastActiveRaw || camera.lastActive);
    const rangeStart = lastActiveStart
      ? new Date(lastActiveStart.getFullYear(), lastActiveStart.getMonth(), lastActiveStart.getDate(), 0, 0, 0, 0)
      : null;
    const rangeEnd = lastActiveEnd
      ? new Date(lastActiveEnd.getFullYear(), lastActiveEnd.getMonth(), lastActiveEnd.getDate(), 23, 59, 59, 999)
      : null;

    const matchesLastActiveRange =
      (!rangeStart && !rangeEnd)
      || (
        lastActiveDate
        && (!rangeStart || lastActiveDate >= rangeStart)
        && (!rangeEnd || lastActiveDate <= rangeEnd)
      );

    return matchesSearch && matchesStatus && matchesLocation && matchesLastActiveRange;
  });

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setNewCamera(EMPTY_CAMERA_FORM);
    setErrors({});
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingId(null);
    setEditErrors({});
  };

  const validateCamera = (cameraInput) => {
    const validationErrors = {};

    if (!cameraInput.name.trim()) {
      validationErrors.name = 'Name is required';
    }

    if (!cameraInput.location.trim()) {
      validationErrors.location = 'Location is required';
    }

    return validationErrors;
  };

  const handleAddCamera = async () => {
    const validationErrors = validateCamera(newCamera);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateCamera({
        name: newCamera.name.trim(),
        location: newCamera.location.trim(),
        status: newCamera.status,
      });
      closeAddModal();
    } catch (submitError) {
      setErrors({ form: submitError.message || 'Unable to create camera.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (camera) => {
    setEditingId(camera.backendId);
    setEditCamera({
      name: camera.name || '',
      location: camera.location || '',
      status: camera.status || 'online',
    });
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  const handleUpdateCamera = async () => {
    const validationErrors = validateCamera(editCamera);

    if (Object.keys(validationErrors).length > 0) {
      setEditErrors(validationErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      await onUpdateCamera(editingId, {
        name: editCamera.name.trim(),
        location: editCamera.location.trim(),
        status: editCamera.status,
      });
      closeEditModal();
    } catch (submitError) {
      setEditErrors({ form: submitError.message || 'Unable to update camera.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCamera = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onDeleteCamera(deleteTarget.backendId);
      setDeleteTarget(null);
    } catch (submitError) {
      setErrors({ form: submitError.message || 'Unable to delete camera.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="dashboard-section history-section">
      <h2>Camera List</h2>

      {error && <p className="profile-error">{error}</p>}

      <div className="cameras-controls">
        <input
          type="text"
          className="cameras-search"
          placeholder="Search cameras..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          className="cameras-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">All Status</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="maintenance">Maintenance</option>
        </select>

        <select
          className="cameras-filter"
          value={locationFilter}
          onChange={(event) => setLocationFilter(event.target.value)}
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
          {!isLoading && filtered.length > 0 ? (
            filtered.map((camera) => (
              <tr key={camera.backendId || camera.id}>
                <td>{camera.id}</td>
                <td>{camera.name}</td>
                <td>{camera.location}</td>
                <td>
                  <span className={`camera-status ${camera.status}`}>
                    {camera.status}
                  </span>
                </td>
                <td>{camera.lastActive}</td>
                <td>{camera.status === 'online' ? (camera.onlineDuration || buildOnlineDuration(camera.lastActiveRaw || camera.lastActive)) : '-'}</td>
                <td className="row-actions">
                  <button className="btn btn-edit" onClick={() => handleStartEdit(camera)}>
                    Edit
                  </button>
                  <button className="btn btn-delete" onClick={() => setDeleteTarget(camera)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="no-results">
                {isLoading ? 'Loading cameras...' : 'No cameras found.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {isAddModalOpen && (
        <div className="modal-overlay" onClick={closeAddModal}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <h3>Add Camera</h3>

            <div className="modal-form-grid">
              <div className="field">
                <label>Name</label>
                <input
                  value={newCamera.name}
                  onChange={(event) => setNewCamera({ ...newCamera, name: event.target.value })}
                />
                {errors.name && <div className="input-error">{errors.name}</div>}
              </div>

              <div className="field">
                <label>Location</label>
                <input
                  value={newCamera.location}
                  onChange={(event) => setNewCamera({ ...newCamera, location: event.target.value })}
                />
                {errors.location && <div className="input-error">{errors.location}</div>}
              </div>

              <div className="field field-full">
                <label>Status</label>
                <select
                  value={newCamera.status}
                  onChange={(event) => setNewCamera({ ...newCamera, status: event.target.value })}
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            {errors.form && <p className="profile-error">{errors.form}</p>}

            <div className="modal-actions">
              <button className="btn btn-add" onClick={handleAddCamera} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
              <button className="btn" onClick={closeAddModal} disabled={isSubmitting}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <h3>Edit Camera</h3>

            <div className="modal-form-grid">
              <div className="field">
                <label>Name</label>
                <input
                  value={editCamera.name}
                  onChange={(event) => setEditCamera({ ...editCamera, name: event.target.value })}
                />
                {editErrors.name && <div className="input-error">{editErrors.name}</div>}
              </div>

              <div className="field">
                <label>Location</label>
                <input
                  value={editCamera.location}
                  onChange={(event) => setEditCamera({ ...editCamera, location: event.target.value })}
                />
                {editErrors.location && <div className="input-error">{editErrors.location}</div>}
              </div>

              <div className="field field-full">
                <label>Status</label>
                <select
                  value={editCamera.status}
                  onChange={(event) => setEditCamera({ ...editCamera, status: event.target.value })}
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            {editErrors.form && <p className="profile-error">{editErrors.form}</p>}

            <div className="modal-actions">
              <button className="btn btn-edit" onClick={handleUpdateCamera} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
              <button className="btn" onClick={closeEditModal} disabled={isSubmitting}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-content modal-confirm" onClick={(event) => event.stopPropagation()}>
            <h3>Delete Camera</h3>
            <p>Delete camera {deleteTarget.id}? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-delete" onClick={handleDeleteCamera} disabled={isSubmitting}>
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
              <button className="btn" onClick={() => setDeleteTarget(null)} disabled={isSubmitting}>
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
