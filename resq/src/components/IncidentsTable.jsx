import { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import TimePickerDropdown from './TimePickerDropdown';
import '../styles/IncidentsTable.css';
import '../styles/Filters.css';
import '../styles/Modal.css';
import '../styles/CRUDButtons.css';

const EMPTY_INCIDENT_FORM = {
  type: 'Fire',
  location: '',
  method: 'Heat Sensor',
  time: '',
  status: 'investigating',
  date: null,
  notes: '',
};

const INCIDENT_TYPES = ['Fire', 'Gas', 'Smoke', 'Other'];
const DETECTION_METHODS = ['Heat Sensor', 'Camera AI', 'Gas Sensor', 'Manual'];

const normalizeDateValue = (dateValue) => {
  if (!dateValue) {
    return '';
  }

  if (typeof dateValue === 'string') {
    return dateValue;
  }

  return dateValue.toISOString().split('T')[0];
};

const IncidentsTable = ({
  incidents = [],
  isLoading = false,
  error = '',
  onCreateIncident,
  onUpdateIncident,
  onDeleteIncident,
}) => {
  const [data, setData] = useState(incidents);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [newIncident, setNewIncident] = useState(EMPTY_INCIDENT_FORM);
  const [editForm, setEditForm] = useState(EMPTY_INCIDENT_FORM);
  const [newErrors, setNewErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setData(incidents);
  }, [incidents]);

  const formatTimeDisplay = (timeValue) => {
    if (!timeValue) {
      return '';
    }

    const rawValue = String(timeValue).trim();

    const twentyFourHourMatch = rawValue.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (twentyFourHourMatch) {
      const hour24 = Number(twentyFourHourMatch[1]);
      const minute = twentyFourHourMatch[2];
      const period = hour24 >= 12 ? 'PM' : 'AM';
      const hour12 = hour24 % 12 || 12;
      return `${String(hour12).padStart(2, '0')}:${minute} ${period}`;
    }

    const twelveHourMatch = rawValue.match(/^(\d{1,2}):([0-5]\d)\s*([AaPp][Mm])$/);
    if (twelveHourMatch) {
      const hour12 = Number(twelveHourMatch[1]);
      const minute = twelveHourMatch[2];
      const period = twelveHourMatch[3].toUpperCase();
      if (hour12 >= 1 && hour12 <= 12) {
        return `${String(hour12).padStart(2, '0')}:${minute} ${period}`;
      }
    }

    return rawValue;
  };

  const filtered = data.filter((item) => {
    const query = search.toLowerCase();
    const matchesSearch =
      (item.id || '').toLowerCase().includes(query)
      || (item.type || '').toLowerCase().includes(query)
      || (item.location || '').toLowerCase().includes(query)
      || (item.method || '').toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    const incidentDate = item.date ? new Date(item.date) : null;

    const matchesSingleDate = !selectedDate
      || (incidentDate && incidentDate.toDateString() === selectedDate.toDateString());

    const matchesMonth = !selectedMonth
      || (
        incidentDate
        && incidentDate.getMonth() === selectedMonth.getMonth()
        && incidentDate.getFullYear() === selectedMonth.getFullYear()
      );

    const matchesRange = (!startDate || !endDate)
      || (incidentDate && incidentDate >= startDate && incidentDate <= endDate);

    return matchesSearch && matchesStatus && matchesSingleDate && matchesMonth && matchesRange;
  });

  const validateIncident = (incident) => {
    const errors = {};

    if (!incident.type.trim()) {
      errors.type = 'Type is required';
    }

    if (!incident.location.trim()) {
      errors.location = 'Location is required';
    }

    if (!incident.method.trim()) {
      errors.method = 'Method is required';
    }

    if (!incident.time) {
      errors.time = 'Time is required';
    }

    if (!incident.date) {
      errors.date = 'Date is required';
    }

    return errors;
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setNewIncident(EMPTY_INCIDENT_FORM);
    setNewErrors({});
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingId(null);
    setEditErrors({});
  };

  const handleCreate = async () => {
    const validationErrors = validateIncident(newIncident);

    if (Object.keys(validationErrors).length > 0) {
      setNewErrors(validationErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateIncident({
        ...newIncident,
        date: normalizeDateValue(newIncident.date),
      });
      closeAddModal();
    } catch (submitError) {
      setNewErrors({ form: submitError.message || 'Unable to create incident.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (item) => {
    setEditingId(item.backendId);
    setEditForm({
      ...item,
      date: item.date ? new Date(item.date) : null,
    });
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    const validationErrors = validateIncident(editForm);

    if (Object.keys(validationErrors).length > 0) {
      setEditErrors(validationErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      await onUpdateIncident(editingId, {
        ...editForm,
        date: normalizeDateValue(editForm.date),
      });
      closeEditModal();
    } catch (submitError) {
      setEditErrors({ form: submitError.message || 'Unable to update incident.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onDeleteIncident(deleteTarget.backendId);
      setDeleteTarget(null);
    } catch (submitError) {
      setEditErrors({ form: submitError.message || 'Unable to delete incident.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="dashboard-section history-section">
      <h2>Recent Incidents</h2>

      {error && <p className="profile-error">{error}</p>}

      <div className="incidents-controls">
        <input
          type="text"
          className="incidents-search"
          placeholder="Search..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          className="incidents-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="investigating">Investigating</option>
        </select>

        <DatePicker
          selected={selectedDate}
          onChange={(date) => {
            setSelectedDate(date);
            setSelectedMonth(null);
            setDateRange([null, null]);
          }}
          placeholderText="Filter by day"
          className="incidents-filter"
          dateFormat="yyyy-MM-dd"
        />

        <DatePicker
          selected={selectedMonth}
          onChange={(date) => {
            setSelectedMonth(date);
            setSelectedDate(null);
            setDateRange([null, null]);
          }}
          dateFormat="yyyy-MM"
          showMonthYearPicker
          placeholderText="Filter by month"
          className="incidents-filter"
        />

        <DatePicker
          selectsRange
          startDate={startDate}
          endDate={endDate}
          onChange={(rangeUpdate) => {
            setDateRange(rangeUpdate);
            setSelectedDate(null);
            setSelectedMonth(null);
          }}
          isClearable
          placeholderText="Filter by range"
          className="incidents-filter"
        />

        <div className="incidents-actions">
          <button className="btn btn-add" onClick={() => setIsAddModalOpen(true)}>Add Incident</button>
        </div>
      </div>

      <table className="incidents-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Location</th>
            <th>Method</th>
            <th>Time</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {!isLoading && filtered.length > 0 ? filtered.map((item) => (
            <tr key={item.backendId || item.id}>
              <td>{item.id}</td>
              <td>{item.type}</td>
              <td>{item.location}</td>
              <td>{item.method}</td>
              <td>{formatTimeDisplay(item.time)}</td>
              <td>{item.date}</td>
              <td><span className={`status-badge ${item.status}`}>{item.status}</span></td>
              <td className="row-actions">
                <button className="btn btn-edit" onClick={() => handleStartEdit(item)}>Edit</button>
                <button className="btn btn-delete" onClick={() => setDeleteTarget(item)}>Delete</button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="8" className="no-results">{isLoading ? 'Loading incidents...' : 'No incidents found'}</td>
            </tr>
          )}
        </tbody>
      </table>

      {isAddModalOpen && (
        <div className="modal-overlay" onClick={closeAddModal}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <h3>Add Incident</h3>
            <div className="modal-form-grid">
              <div className="field">
                <label>Type</label>
                <select value={newIncident.type} onChange={(event) => setNewIncident({ ...newIncident, type: event.target.value })}>
                  {INCIDENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                {newErrors.type && <div className="input-error">{newErrors.type}</div>}
              </div>
              <div className="field">
                <label>Location</label>
                <input value={newIncident.location} onChange={(event) => setNewIncident({ ...newIncident, location: event.target.value })} />
                {newErrors.location && <div className="input-error">{newErrors.location}</div>}
              </div>
              <div className="field">
                <label>Method</label>
                <select value={newIncident.method} onChange={(event) => setNewIncident({ ...newIncident, method: event.target.value })}>
                  {DETECTION_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
                </select>
                {newErrors.method && <div className="input-error">{newErrors.method}</div>}
              </div>
              <div className="field">
                <label>Time</label>
                <TimePickerDropdown
                  value={newIncident.time}
                  onChange={(time) => setNewIncident({ ...newIncident, time })}
                  placeholder="Select time"
                />
                {newErrors.time && <div className="input-error">{newErrors.time}</div>}
              </div>
              <div className="field">
                <label>Date</label>
                <DatePicker
                  selected={newIncident.date}
                  onChange={(date) => setNewIncident({ ...newIncident, date })}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select a date"
                />
                {newErrors.date && <div className="input-error">{newErrors.date}</div>}
              </div>
              <div className="field field-full">
                <label>Status</label>
                <select value={newIncident.status} onChange={(event) => setNewIncident({ ...newIncident, status: event.target.value })}>
                  <option value="open">Open</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
            {newErrors.form && <p className="profile-error">{newErrors.form}</p>}
            <div className="modal-actions">
              <button className="btn btn-add" onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
              <button className="btn" onClick={closeAddModal} disabled={isSubmitting}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <h3>Edit Incident</h3>
            <div className="modal-form-grid">
              <div className="field">
                <label>Type</label>
                <select value={editForm.type} onChange={(event) => setEditForm({ ...editForm, type: event.target.value })}>
                  {INCIDENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                {editErrors.type && <div className="input-error">{editErrors.type}</div>}
              </div>
              <div className="field">
                <label>Location</label>
                <input value={editForm.location} onChange={(event) => setEditForm({ ...editForm, location: event.target.value })} />
                {editErrors.location && <div className="input-error">{editErrors.location}</div>}
              </div>
              <div className="field">
                <label>Method</label>
                <select value={editForm.method} onChange={(event) => setEditForm({ ...editForm, method: event.target.value })}>
                  {DETECTION_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
                </select>
                {editErrors.method && <div className="input-error">{editErrors.method}</div>}
              </div>
              <div className="field">
                <label>Time</label>
                <TimePickerDropdown
                  value={editForm.time}
                  onChange={(time) => setEditForm({ ...editForm, time })}
                  placeholder="Select time"
                />
                {editErrors.time && <div className="input-error">{editErrors.time}</div>}
              </div>
              <div className="field">
                <label>Date</label>
                <DatePicker
                  selected={editForm.date}
                  onChange={(date) => setEditForm({ ...editForm, date })}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select a date"
                />
                {editErrors.date && <div className="input-error">{editErrors.date}</div>}
              </div>
              <div className="field field-full">
                <label>Status</label>
                <select value={editForm.status} onChange={(event) => setEditForm({ ...editForm, status: event.target.value })}>
                  <option value="open">Open</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
            {editErrors.form && <p className="profile-error">{editErrors.form}</p>}
            <div className="modal-actions">
              <button className="btn btn-edit" onClick={handleUpdate} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
              <button className="btn" onClick={closeEditModal} disabled={isSubmitting}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-content modal-confirm" onClick={(event) => event.stopPropagation()}>
            <h3>Delete Incident</h3>
            <p>Delete incident {deleteTarget.id}? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-delete" onClick={handleDelete} disabled={isSubmitting}>
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
              <button className="btn" onClick={() => setDeleteTarget(null)} disabled={isSubmitting}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default IncidentsTable;
