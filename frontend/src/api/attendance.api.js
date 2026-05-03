import api from './axios.js';

export const getAttendanceStatus = () => api.get('/attendance/status').then((r) => r.data);
export const checkIn = () => api.post('/attendance/check-in').then((r) => r.data);
export const checkOut = () => api.post('/attendance/check-out').then((r) => r.data);
export const getMyAttendance = (params) => api.get('/attendance/me', { params }).then((r) => r.data);

// Admin
export const getAllAttendance = (params) => api.get('/attendance/all', { params }).then((r) => r.data);
export const listPunches = (params) => api.get('/attendance/punches', { params }).then((r) => r.data);
export const createPunch = (data) => api.post('/attendance/admin', data).then((r) => r.data);
export const updatePunch = (id, data) => api.patch(`/attendance/${id}`, data).then((r) => r.data);
export const deletePunch = (id) => api.delete(`/attendance/${id}`).then((r) => r.data);
