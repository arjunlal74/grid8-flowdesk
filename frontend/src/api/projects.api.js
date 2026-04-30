import api from './axios.js';

export const getProjects = () => api.get('/projects').then(r => r.data);
export const getProject = (id) => api.get(`/projects/${id}`).then(r => r.data);
export const createProject = (data) => api.post('/projects', data).then(r => r.data);
export const updateProject = (id, data) => api.patch(`/projects/${id}`, data).then(r => r.data);
export const addMember = (id, data) => api.post(`/projects/${id}/members`, data).then(r => r.data);
export const removeMember = (id, employeeId) => api.delete(`/projects/${id}/members/${employeeId}`);
