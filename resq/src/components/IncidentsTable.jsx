import { useState, useEffect } from 'react';

import '../styles/IncidentsTable.css';

const IncidentsTable = ({ incidents, onIncidentsChange }) => {
  const [data, setData] = useState(incidents || []);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [adding, setAdding] = useState(false);
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
    const maxId = data.reduce((m, it) => (it.id > m ? it.id : m), 0);
    const created = { ...newIncident, id: maxId + 1, time: timeVal };
    const next = [created, ...data];
    notifyChange(next);
    setNewIncident(emptyForm);
    setAdding(false);
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditForm({ type: item.type, location: item.location, method: item.method, time: item.time, status: item.status });
    setEditErrors({});
  };

  const handleUpdate = (id) => {
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
    const next = data.map(it => (it.id === id ? { ...it, ...editForm } : it));
    notifyChange(next);
    setEditingId(null);
  };

  const handleDelete = (id) => {
    const ok = window.confirm('Delete this incident? This action cannot be undone.');
    if (!ok) return;
    const next = data.filter(it => it.id !== id);
    notifyChange(next);
    if (editingId === id) setEditingId(null);
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
          {!adding ? (
            <button className="btn" onClick={() => setAdding(true)}>Add Incident</button>
          ) : (
            <div className="add-form">
              <div className="field">
                <input placeholder="Type" value={newIncident.type} onChange={e => setNewIncident({ ...newIncident, type: e.target.value })} />
                {newErrors.type && <div className="input-error">{newErrors.type}</div>}
              </div>
              <div className="field">
                <input placeholder="Location" value={newIncident.location} onChange={e => setNewIncident({ ...newIncident, location: e.target.value })} />
                {newErrors.location && <div className="input-error">{newErrors.location}</div>}
              </div>
              <div className="field">
                <input placeholder="Method" value={newIncident.method} onChange={e => setNewIncident({ ...newIncident, method: e.target.value })} />
                {newErrors.method && <div className="input-error">{newErrors.method}</div>}
              </div>
              <div className="field">
                <input placeholder="Time" value={newIncident.time} onChange={e => setNewIncident({ ...newIncident, time: e.target.value })} />
                {newErrors.time && <div className="input-error">{newErrors.time}</div>}
              </div>
              <select value={newIncident.status} onChange={e => setNewIncident({ ...newIncident, status: e.target.value })}>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
              </select>
              <button className="btn btn-primary" onClick={handleCreate}>Save</button>
              <button className="btn" onClick={() => { setAdding(false); setNewIncident(emptyForm); setNewErrors({}); }}>Cancel</button>
            </div>
          )}
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
                {editingId === item.id ? (
                <>
                  <td>
                    <input value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })} />
                    {editErrors.type && <div className="input-error">{editErrors.type}</div>}
                  </td>
                  <td>
                    <input value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} />
                    {editErrors.location && <div className="input-error">{editErrors.location}</div>}
                  </td>
                  <td>
                    <input value={editForm.method} onChange={e => setEditForm({ ...editForm, method: e.target.value })} />
                    {editErrors.method && <div className="input-error">{editErrors.method}</div>}
                  </td>
                  <td>
                    <input value={editForm.time} onChange={e => setEditForm({ ...editForm, time: e.target.value })} />
                    {editErrors.time && <div className="input-error">{editErrors.time}</div>}
                  </td>
                  <td>
                    <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                      <option value="investigating">Investigating</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>
                  <td className="row-actions">
                    <button className="btn btn-primary" onClick={() => handleUpdate(item.id)}>Save</button>
                    <button className="btn" onClick={() => setEditingId(null)}>Cancel</button>
                    <button className="btn btn-danger" onClick={() => handleDelete(item.id)}>Delete</button>
                  </td>
                </>
              ) : (
                <>
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
                    <button className="btn" onClick={() => handleStartEdit(item)}>Edit</button>
                    <button className="btn btn-danger" onClick={() => handleDelete(item.id)}>Delete</button>
                  </td>
                </>
              )}
            </tr>
          )) : (
            <tr>
              <td colSpan="7" className="no-results">No incidents match your search.</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
};

export default IncidentsTable;
