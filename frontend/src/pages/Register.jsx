import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TIME_SLOTS = [
  '09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
  '12:00 PM','12:30 PM','02:00 PM','02:30 PM','03:00 PM','03:30 PM',
  '04:00 PM','04:30 PM','05:00 PM',
];

const SPECIALIZATIONS = [
  'General Physician','Cardiologist','Dermatologist','Neurologist',
  'Orthopedist','Pediatrician','Psychiatrist','Radiologist',
  'Surgeon','Urologist','Gynecologist','Ophthalmologist',
  'ENT Specialist','Dentist','Endocrinologist',
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '', password: '', name: '', email: '',
    role: 'patient', phone: '', specialization: '',
    dateOfBirth: '', gender: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Remove empty string fields so optional enum fields don't fail validation
      const payload = Object.fromEntries(
        Object.entries(form).filter(([_, v]) => v !== '')
      );
      const result = await register(payload);
      navigate('/verify-email', { state: { email: result.email || form.email } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 560 }}>
        <div className="auth-header">
          <div className="auth-logo">🏥</div>
          <div className="auth-title">Create Account</div>
          <div className="auth-subtitle">Join MediBook and verify your email to continue</div>
        </div>
        <div className="auth-body">
          {error && <div className="alert alert-error">⚠️ {error}</div>}
          <form onSubmit={handleSubmit}>
            {/* Role selection */}
            <div className="form-group">
              <label className="form-label">Register as <span>*</span></label>
              <div style={{ display: 'flex', gap: 10 }}>
                {['patient', 'doctor'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm({ ...form, role: r })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 8,
                      border: `2px solid ${form.role === r ? 'var(--primary)' : 'var(--border)'}`,
                      background: form.role === r ? 'var(--primary-light)' : 'white',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      color: form.role === r ? 'var(--primary-dark)' : 'var(--text-muted)',
                      textTransform: 'capitalize',
                      transition: 'all 0.15s',
                    }}
                  >
                    {r === 'patient' ? '🧑 Patient' : '👨‍⚕️ Doctor'}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name <span>*</span></label>
                <input className="form-control" name="name" placeholder="Your full name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Username <span>*</span></label>
                <input className="form-control" name="username" placeholder="Choose a username" value={form.username} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email <span>*</span></label>
              <input className="form-control" type="email" name="email" placeholder="your@email.com" value={form.email} onChange={handleChange} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password <span>*</span></label>
                <input className="form-control" type="password" name="password" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" name="phone" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={handleChange} />
              </div>
            </div>

            {form.role === 'doctor' && (
              <div className="form-group">
                <label className="form-label">Specialization <span>*</span></label>
                <select className="form-control" name="specialization" value={form.specialization} onChange={handleChange} required>
                  <option value="">Select specialization</option>
                  {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

            {form.role === 'patient' && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input className="form-control" type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-control" name="gender" value={form.gender} onChange={handleChange}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? <><span className="spinner" /> Creating account...</> : 'Create Account'}
            </button>
          </form>
        </div>
        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
