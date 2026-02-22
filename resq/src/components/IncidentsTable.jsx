import { useState, useEffect } from 'react';

import '../styles/IncidentsTable.css';

const IncidentsTable = ({ incidents, onIncidentsChange }) => {
  const [data, setData] = useState(incidents || []);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (incidents && incidents.length) {
      setData(incidents || []);
      try { window.localStorage.setItem('incidents', JSON.stringify(incidents)); } catch (e) {}
    } else {
      try {
        const stored = window.localStorage.getItem('incidents');
        if (stored) setData(JSON.parse(stored));
      } catch (e) {}
    }
  }, [incidents]);

  useEffect(() => {
    try { window.localStorage.setItem('incidents', JSON.stringify(data)); } catch (e) {}
  }, [data]);

  const filtered = data.filter(item => {
    const q = search.toLowerCase();
    const matchesSearch =
      item.id.toString().toLowerCase().includes(q) ||
      (item.type || '').toLowerCase().includes(q) ||
      (item.location || '').toLowerCase().includes(q) ||
      (item.method || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const notifyChange = (next) => {
    setData(next);
    if (typeof onIncidentsChange === 'function') onIncidentsChange(next);
  };

  const toIncidentNumber = (id) => {
    const value = String(id || '');
    const match = value.match(/(\d+)/);
    return match ? Number(match[1]) : 0;
  };

  const generateNextIncidentId = () => {
    const maxId = data.reduce((max, item) => Math.max(max, toIncidentNumber(item.id)), 0);
    return `#INC-${String(maxId + 1).padStart(3, '0')}`;
  };

  const emptyForm = { type: '', location: '', method: '', time: '', status: 'investigating' };
  const [newIncident, setNewIncident] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [newErrors, setNewErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});

  const handleCreate = () => {
    const errors = {};
    if (!newIncident.type.trim()) errors.type = 'Type is required';
    if (!newIncident.location.trim()) errors.location = 'Location is required';
    if (!newIncident.method.trim()) errors.method = 'Method is required';
    const timeVal = newIncident.time.trim() || new Date().toLocaleString();
    if (!timeVal) errors.time = 'Time is required';
    if (Object.keys(errors).length) {
      setNewErrors(errors);
      return;
    }
    setNewErrors({});
    const created = { ...newIncident, id: generateNextIncidentId(), time: timeVal };
    const next = [created, ...data];
    notifyChange(next);
    setNewIncident(emptyForm);
    setIsAddModalOpen(false);
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditForm({ type: item.type, location: item.location, method: item.method, time: item.time, status: item.status });
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    const errors = {};
    if (!editForm.type.trim()) errors.type = 'Type is required';
    if (!editForm.location.trim()) errors.location = 'Location is required';
    if (!editForm.method.trim()) errors.method = 'Method is required';
    if (!editForm.time.trim()) errors.time = 'Time is required';
    if (Object.keys(errors).length) {
      setEditErrors(errors);
      return;
    }
    setEditErrors({});
    const next = data.map(it => (it.id === editingId ? { ...it, ...editForm } : it));
    notifyChange(next);
    setEditingId(null);
    setIsEditModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const next = data.filter(it => it.id !== deleteTarget.id);
    notifyChange(next);
    if (editingId === deleteTarget.id) {
      setEditingId(null);
      setIsEditModalOpen(false);
    }
    setDeleteTarget(null);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setNewIncident(emptyForm);
    setNewErrors({});
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingId(null);
    setEditErrors({});
  };

  return (
    <section className="dashboard-section history-section">
      <h2>Recent Incidents</h2>

      <div className="incidents-controls">
        <input
          type="text"
          className="incidents-search"
          placeholder="Search incidents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="incidents-filter"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="resolved">Resolved</option>
          <option value="investigating">Investigating</option>
        </select>
        <div className="incidents-actions">
          <button className="btn btn-add" onClick={() => setIsAddModalOpen(true)}>Add Incident</button>
        </div>
      </div>

      <table className="incidents-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Event Type</th>
            <th>Location</th>
            <th>Detection Method</th>
            <th>Time</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filtered.length > 0 ? filtered.map(item => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.type}</td>
              <td>{item.location}</td>
              <td>{item.method}</td>
              <td>{item.time}</td>
              <td>
                <span className={`status-badge ${item.status}`}>
                  {item.status}
                </span>
              </td>
              <td className="row-actions">
                <button className="btn btn-edit" onClick={() => handleStartEdit(item)}>Edit</button>
                <button className="btn btn-delete" onClick={() => setDeleteTarget(item)}>Delete</button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="7" className="no-results">No incidents match your search.</td>
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
                <input placeholder="Type" value={newIncident.type} onChange={e => setNewIncident({ ...newIncident, type: e.target.value })} />
                {newErrors.type && <div className="input-error">{newErrors.type}</div>}
              </div>
              <div className="field">
                <label>Location</label>
                <input placeholder="Location" value={newIncident.location} onChange={e => setNewIncident({ ...newIncident, location: e.target.value })} />
                {newErrors.location && <div className="input-error">{newErrors.location}</div>}
              </div>
              <div className="field">
                <label>Method</label>
                <input placeholder="Method" value={newIncident.method} onChange={e => setNewIncident({ ...newIncident, method: e.target.value })} />
                {newErrors.method && <div className="input-error">{newErrors.method}</div>}
              </div>
              <div className="field">
                <label>Time</label>
                <input placeholder="Time" value={newIncident.time} onChange={e => setNewIncident({ ...newIncident, time: e.target.value })} />
                {newErrors.time && <div className="input-error">{newErrors.time}</div>}
              </div>
              <div className="field field-full">
                <label>Status</label>
                <select value={newIncident.status} onChange={e => setNewIncident({ ...newIncident, status: e.target.value })}>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-add" onClick={handleCreate}>Save</button>
              <button className="btn" onClick={closeAddModal}>Cancel</button>
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
                <input value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })} />
                {editErrors.type && <div className="input-error">{editErrors.type}</div>}
              </div>
              <div className="field">
                <label>Location</label>
                <input value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} />
                {editErrors.location && <div className="input-error">{editErrors.location}</div>}
              </div>
              <div className="field">
                <label>Method</label>
                <input value={editForm.method} onChange={e => setEditForm({ ...editForm, method: e.target.value })} />
                {editErrors.method && <div className="input-error">{editErrors.method}</div>}
              </div>
              <div className="field">
                <label>Time</label>
                <input value={editForm.time} onChange={e => setEditForm({ ...editForm, time: e.target.value })} />
                {editErrors.time && <div className="input-error">{editErrors.time}</div>}
              </div>
              <div className="field field-full">
                <label>Status</label>
                <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-edit" onClick={handleUpdate}>Save</button>
              <button className="btn" onClick={closeEditModal}>Cancel</button>
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
              <button className="btn btn-delete" onClick={handleDelete}>Delete</button>
              <button className="btn" onClick={() => setDeleteTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default IncidentsTable;
