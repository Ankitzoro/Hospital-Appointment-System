import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAppointments } from '../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAppointments()
      .then((res) => setAppointments(res.data.appointments))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const booked = appointments.filter((a) => a.status === 'booked');
  const cancelled = appointments.filter((a) => a.status === 'cancelled');
  const completed = appointments.filter((a) => a.status === 'completed');

  const upcoming = booked
    .filter((a) => new Date(a.appointmentDate) >= new Date())
    .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
    .slice(0, 5);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">👋 Welcome, {user.name}</h1>
        <p className="page-subtitle">
          {user.role === 'patient'
            ? 'Manage your medical appointments in one place'
            : `Dashboard for Dr. ${user.name} — ${user.specialization}`}
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0f2fe' }}>📅</div>
          <div>
            <div className="stat-value">{loading ? '—' : booked.length}</div>
            <div className="stat-label">Active Appointments</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7' }}>✅</div>
          <div>
            <div className="stat-value">{loading ? '—' : completed.length}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fee2e2' }}>❌</div>
          <div>
            <div className="stat-value">{loading ? '—' : cancelled.length}</div>
            <div className="stat-label">Cancelled</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7' }}>📊</div>
          <div>
            <div className="stat-value">{loading ? '—' : appointments.length}</div>
            <div className="stat-label">Total All Time</div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        {user.role === 'patient' && (
          <Link to="/doctors" className="btn btn-primary">
            📅 Book Appointment
          </Link>
        )}
        <Link to="/appointments" className="btn btn-outline">
          View All Appointments
        </Link>
      </div>

      {/* Upcoming appointments */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Upcoming Appointments</span>
          <Link to="/appointments" className="btn btn-ghost btn-sm">View all →</Link>
        </div>
        <div className="table-wrapper">
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <div className="spinner spinner-dark" style={{ width: 28, height: 28, margin: '0 auto' }} />
            </div>
          ) : upcoming.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-text">No upcoming appointments</div>
              {user.role === 'patient' && (
                <div className="empty-state-sub">
                  <Link to="/doctors" className="btn btn-primary btn-sm" style={{ marginTop: 12, display: 'inline-flex' }}>
                    Book your first appointment
                  </Link>
                </div>
              )}
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
                </tr>
              </thead>
              <tbody>
                {upcoming.map((appt) => (
                  <tr key={appt._id}>
                    <td style={{ fontWeight: 500 }}>
                      {user.role === 'patient'
                        ? `Dr. ${appt.doctor?.name}`
                        : appt.patient?.name}
                    </td>
                    <td>{formatDate(appt.appointmentDate)}</td>
                    <td>{appt.timeSlot}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{appt.reason}</td>
                    <td><span className={`badge badge-${appt.status}`}>{appt.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
