import api from './axios.js';

export const uploadEmployeeAvatar = (file) => {
  const form = new FormData();
  form.append('avatar', file);
  return api.post('/employees/upload-avatar', form).then(r => r.data);
};

export const getEmployees = () => api.get('/employees').then(r => r.data);
export const getEmployee = (id) => api.get(`/employees/${id}`).then(r => r.data);
export const createEmployee = (data) => api.post('/employees', data).then(r => r.data);
export const updateEmployee = (id, data) => api.patch(`/employees/${id}`, data).then(r => r.data);
export const deactivateEmployee = (id) => api.post(`/employees/${id}/deactivate`).then(r => r.data);
export const reactivateEmployee = (id) => api.post(`/employees/${id}/reactivate`).then(r => r.data);
export const resetPassword = (id, newPassword) => api.post(`/employees/${id}/reset-password`, { newPassword }).then(r => r.data);
