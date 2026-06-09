import React, { useEffect, useState } from 'react';
import { getDoctors, bookAppointment } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TIME_SLOTS = [
  '09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
  '12:00 PM','12:30 PM','02:00 PM','02:30 PM','03:00 PM','03:30 PM',
  '04:00 PM','04:30 PM','05:00 PM',
];

function BookModal({ doctor, onClose, onSuccess }) {
  const [form, setForm] = useState({ appointmentDate: '', timeSlot: '', reason: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await bookAppointment({ doctorId: doctor._id, ...form });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">📅 Book Appointment</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ background: 'var(--primary-light)', borderRadius: 10, padding: '14px 16px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ fontSize: '1.5rem' }}>👨‍⚕️</div>
            <div>
              <div style={{ fontWeight: 600 }}>Dr. {doctor.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--primary-dark)' }}>{doctor.specialization}</div>
            </div>
          </div>

          {error && <div className="alert alert-error">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date <span>*</span></label>
                <input
                  className="form-control"
                  type="date"
                  min={today}
                  value={form.appointmentDate}
                  onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Time Slot <span>*</span></label>
                <select
                  className="form-control"
                  value={form.timeSlot}
                  onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                  required
                >
                  <option value="">Select time</option>
                  {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Reason <span>*</span></label>
              <input
                className="form-control"
                placeholder="Brief reason for visit"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Additional Notes</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Any additional information for the doctor..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                style={{ resize: 'vertical' }}
              />
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={loading} onClick={handleSubmit}>
            {loading ? <><span className="spinner" /> Booking...</> : '✅ Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Doctors() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchDoctors = () => {
    setLoading(true);
    getDoctors()
      .then((res) => setDoctors(res.data.doctors))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDoctors(); }, []);

  const filtered = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialization?.toLowerCase().includes(search.toLowerCase())
  );

  const handleBookSuccess = () => {
    setSelectedDoctor(null);
    setSuccessMsg(`Appointment booked successfully with Dr. ${selectedDoctor.name}!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const getInitials = (name) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">👨‍⚕️ Doctors</h1>
        <p className="page-subtitle">Browse available doctors and book appointments</p>
      </div>

      {successMsg && <div className="alert alert-success">✅ {successMsg}</div>}

      <div className="filter-bar">
        <input
          className="form-control"
          placeholder="🔍 Search by name or specialization..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 340 }}
        />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {filtered.length} doctor{filtered.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div className="spinner spinner-dark" style={{ width: 36, height: 36, margin: '0 auto' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-text">No doctors found</div>
          <div className="empty-state-sub">Try a different search term</div>
        </div>
      ) : (
        <div className="doctors-grid">
          {filtered.map((doc) => (
            <div key={doc._id} className="doctor-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="doctor-avatar">{getInitials(doc.name)}</div>
                <div>
                  <div className="doctor-name">Dr. {doc.name}</div>
                  <div className="doctor-spec">{doc.specialization}</div>
                </div>
              </div>
              {doc.email && (
                <div className="doctor-meta">
                  📧 {doc.email}
                </div>
              )}
              {doc.phone && (
                <div className="doctor-meta">
                  📞 {doc.phone}
                </div>
              )}
              {user.role === 'patient' && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setSelectedDoctor(doc)}
                  style={{ marginTop: 4 }}
                >
                  📅 Book Appointment
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedDoctor && (
        <BookModal
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          onSuccess={handleBookSuccess}
        />
      )}
    </div>
  );
}
