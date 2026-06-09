import React, { useEffect, useState, useCallback } from 'react';
import { getAppointments, cancelAppointment, completeAppointment } from '../services/api';
import { useAuth } from '../context/AuthContext';

function CancelModal({ appointment, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleCancel = async () => {
    setLoading(true);
    setError('');
    try {
      await cancelAppointment(appointment._id, reason);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel appointment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">❌ Cancel Appointment</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: 16, padding: '12px 14px', background: 'var(--bg)', borderRadius: 8, fontSize: '0.9rem' }}>
            <div><strong>{user.role === 'patient' ? `Dr. ${appointment.doctor?.name}` : appointment.patient?.name}</strong></div>
            <div style={{ color: 'var(--text-muted)' }}>
              {new Date(appointment.appointmentDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} • {appointment.timeSlot}
            </div>
          </div>
          {error && <div className="alert alert-error">⚠️ {error}</div>}
          <div className="form-group">
            <label className="form-label">Cancellation Reason (optional)</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Reason for cancellation..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Keep Appointment</button>
          <button className="btn btn-danger" disabled={loading} onClick={handleCancel}>
            {loading ? <><span className="spinner" /> Cancelling...</> : 'Cancel Appointment'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CompleteModal({ appointment, onClose, onSuccess }) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleComplete = async () => {
    setLoading(true);
    setError('');
    try {
      await completeAppointment(appointment._id, notes);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete appointment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">✓ Complete Appointment</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: 16, padding: '12px 14px', background: 'var(--bg)', borderRadius: 8, fontSize: '0.9rem' }}>
            <div><strong>{user.role === 'patient' ? `Dr. ${appointment.doctor?.name}` : appointment.patient?.name}</strong></div>
            <div style={{ color: 'var(--text-muted)' }}>
              {new Date(appointment.appointmentDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} • {appointment.timeSlot}
            </div>
          </div>
          {error && <div className="alert alert-error">⚠️ {error}</div>}
          <div className="form-group">
            <label className="form-label">Additional Notes</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Write consultation notes, diagnosis, prescriptions, or follow-up instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={loading} onClick={handleComplete}>
            {loading ? <><span className="spinner" /> Saving...</> : 'Mark as Completed'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchAppointments = useCallback(() => {
    setLoading(true);
    getAppointments()
      .then((res) => setAppointments(res.data.appointments))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const tabs = [
    { key: 'all', label: 'All', count: appointments.length },
    { key: 'booked', label: 'Booked', count: appointments.filter((a) => a.status === 'booked').length },
    { key: 'completed', label: 'Completed', count: appointments.filter((a) => a.status === 'completed').length },
    { key: 'cancelled', label: 'Cancelled', count: appointments.filter((a) => a.status === 'cancelled').length },
  ];

  const filtered = activeTab === 'all' ? appointments : appointments.filter((a) => a.status === activeTab);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const handleCancelSuccess = () => {
    setCancelTarget(null);
    setMessage({ type: 'success', text: 'Appointment cancelled successfully.' });
    fetchAppointments();
    setTimeout(() => setMessage({ type: '', text: '' }), 3500);
  };

  const handleCompleteSuccess = () => {
    setCompleteTarget(null);
    setMessage({ type: 'success', text: 'Appointment marked as completed.' });
    fetchAppointments();
    setTimeout(() => setMessage({ type: '', text: '' }), 3500);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📅 Appointments</h1>
        <p className="page-subtitle">Track and manage all your appointments</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
          {message.type === 'success' ? '✅' : '⚠️'} {message.text}
        </div>
      )}

      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
            <span style={{
              marginLeft: 6,
              background: activeTab === t.key ? 'var(--primary)' : 'var(--border)',
              color: activeTab === t.key ? 'white' : 'var(--text-muted)',
              borderRadius: 99,
              padding: '1px 7px',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div className="spinner spinner-dark" style={{ width: 32, height: 32, margin: '0 auto' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-text">No {activeTab !== 'all' ? activeTab : ''} appointments found</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{user.role === 'patient' ? 'Doctor' : 'Patient'}</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((appt) => (
                  <tr key={appt._id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>
                        {user.role === 'patient'
                          ? `Dr. ${appt.doctor?.name}`
                          : appt.patient?.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {user.role === 'patient' ? appt.doctor?.specialization : appt.patient?.email}
                      </div>
                    </td>
                    <td>{formatDate(appt.appointmentDate)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{appt.timeSlot}</td>
                    <td style={{ color: 'var(--text-muted)', maxWidth: 180 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {appt.reason}
                      </div>
                    </td>
                    <td><span className={`badge badge-${appt.status}`}>{appt.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {appt.status === 'booked' && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setCancelTarget(appt)}
                          >
                            Cancel
                          </button>
                        )}
                        {appt.status === 'booked' && user.role === 'doctor' && (
                          <button
                            className="btn btn-sm"
                            style={{ background: 'var(--success-light)', color: '#166534' }}
                            onClick={() => setCompleteTarget(appt)}
                          >
                            ✓ Done
                          </button>
                        )}
                        {appt.status === 'cancelled' && appt.cancellationReason && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {appt.cancellationReason}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {cancelTarget && (
        <CancelModal
          appointment={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onSuccess={handleCancelSuccess}
        />
      )}

      {completeTarget && (
        <CompleteModal
          appointment={completeTarget}
          onClose={() => setCompleteTarget(null)}
          onSuccess={handleCompleteSuccess}
        />
      )}
    </div>
  );
}
