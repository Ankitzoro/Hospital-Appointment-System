import React, { useEffect, useState } from 'react';
import { getPatients } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function getPatientNote(appointment) {
  return appointment.patientNotes || appointment.notes || '';
}

function PatientDetailsModal({ patient, onClose }) {
  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '-';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()} style={{ maxWidth: 760 }}>
        <div className="modal-header">
          <span className="modal-title">Patient Details</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>
        <div className="modal-body">
          <div className="card" style={{ boxShadow: 'none', marginBottom: 16 }}>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Name</div>
                  <div style={{ fontWeight: 600 }}>{patient.name}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Email</div>
                  <div>{patient.email}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Phone</div>
                  <div>{patient.phone || '-'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Gender</div>
                  <div style={{ textTransform: 'capitalize' }}>{patient.gender || '-'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Date of Birth</div>
                  <div>{formatDate(patient.dateOfBirth)}</div>
                </div>
              </div>
            </div>
          </div>

          {!patient.appointments?.length ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <div className="empty-state-text">No appointment details found</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {patient.appointments.map((appointment) => {
                const patientNote = getPatientNote(appointment);

                return (
                  <div key={appointment._id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{formatDate(appointment.appointmentDate)}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{appointment.timeSlot}</div>
                      </div>
                      <span className={`badge badge-${appointment.status}`}>{appointment.status}</span>
                    </div>

                    <div style={{ display: 'grid', gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>Reason</div>
                        <div style={{ color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>
                          {appointment.reason || '-'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>Patient Additional Notes</div>
                        <div style={{ color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>
                          {patientNote || '-'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>Doctor Completion Notes</div>
                        <div style={{ color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>
                          {appointment.doctorNotes || '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Patients() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    if (user.role !== 'doctor') {
      navigate('/dashboard');
      return;
    }

    getPatients()
      .then((res) => setPatients(res.data.patients))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const filtered = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(search.toLowerCase()) ||
      patient.email.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '-';

  const getAge = (dob) => {
    if (!dob) return null;
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  };

  const getInitials = (name) =>
    name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Patients</h1>
        <p className="page-subtitle">Click a patient to view full details and appointment notes</p>
      </div>

      <div className="filter-bar">
        <input
          className="form-control"
          placeholder="Search by name or email..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ maxWidth: 320 }}
        />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {filtered.length} patient{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div className="spinner spinner-dark" style={{ width: 32, height: 32, margin: '0 auto' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-text">No patients found</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Gender</th>
                  <th>Date of Birth</th>
                  <th>Age</th>
                  <th>Latest Patient Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((patient) => {
                  const latestNote = patient.latestAppointment ? getPatientNote(patient.latestAppointment) : '';

                  return (
                    <tr
                      key={patient._id}
                      onClick={() => setSelectedPatient(patient)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedPatient(patient);
                        }
                      }}
                      tabIndex={0}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              background: 'var(--success-light)',
                              color: '#166534',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(patient.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500 }}>{patient.name}</div>
                            <div className="badge badge-patient" style={{ marginTop: 2 }}>patient</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{patient.email}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{patient.phone || '-'}</td>
                      <td style={{ textTransform: 'capitalize', color: 'var(--text-muted)' }}>{patient.gender || '-'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{formatDate(patient.dateOfBirth)}</td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {getAge(patient.dateOfBirth) ? `${getAge(patient.dateOfBirth)} yrs` : '-'}
                      </td>
                      <td style={{ color: 'var(--text-muted)', minWidth: 260 }}>
                        {latestNote ? (
                          <div>
                            <div style={{ fontWeight: 500, color: 'var(--text)' }}>
                              {formatDate(patient.latestAppointment.appointmentDate)}
                            </div>
                            <div
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: 300,
                              }}
                              title={latestNote}
                            >
                              {latestNote}
                            </div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedPatient && (
        <PatientDetailsModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}
    </div>
  );
}
