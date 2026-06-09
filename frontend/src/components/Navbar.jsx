import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/dashboard" className="navbar-brand">
          <div className="brand-icon">🏥</div>
          MediBook
        </NavLink>

        <div className="navbar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span>🏠</span> <span>Dashboard</span>
          </NavLink>
          <NavLink to="/appointments" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span>📅</span> <span>Appointments</span>
          </NavLink>
          <NavLink to="/doctors" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span>👨‍⚕️</span> <span>Doctors</span>
          </NavLink>
          {user.role === 'doctor' && (
            <NavLink to="/patients" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span>🧑‍🤝‍🧑</span> <span>Patients</span>
            </NavLink>
          )}
        </div>

        <div className="nav-user">
          <div className="nav-user-info">
            <span className="nav-user-name">{user.name}</span>
            <span className="nav-user-role">
              <span className={`badge badge-${user.role}`}>{user.role}</span>
            </span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
