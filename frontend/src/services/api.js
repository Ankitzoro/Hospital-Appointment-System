import axios from 'axios';

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://hospital-appointment-system-tyo6.onrender.com/api'
    : '/api');

const API = axios.create({
  baseURL: API_URL,
});

// Attach token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');
export const verifyEmailOtp = (data) => API.post('/auth/verify-email', data);
export const resendVerificationOtp = (data) => API.post('/auth/resend-verification-otp', data);

// Users
export const getDoctors = (specialization) =>
  API.get('/users/doctors', { params: { specialization } });
export const getPatients = () => API.get('/users/patients');
export const getUserById = (id) => API.get(`/users/${id}`);

// Appointments
export const bookAppointment = (data) => API.post('/appointments', data);
export const getAppointments = (params) => API.get('/appointments', { params });
export const getAppointmentById = (id) => API.get(`/appointments/${id}`);
export const cancelAppointment = (id, reason) =>
  API.patch(`/appointments/${id}/cancel`, { cancellationReason: reason });
export const completeAppointment = (id, notes) =>
  API.patch(`/appointments/${id}/complete`, { notes });

export default API;
