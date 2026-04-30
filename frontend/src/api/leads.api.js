import api from './axios.js';

export const getLeads = (params) => api.get('/leads', { params }).then(r => r.data);
export const getLead = (id) => api.get(`/leads/${id}`).then(r => r.data);
export const createLead = (data) => api.post('/leads', data).then(r => r.data);
export const updateLead = (id, data) => api.patch(`/leads/${id}`, data).then(r => r.data);
export const deleteLead = (id) => api.delete(`/leads/${id}`);
export const moveLead = (id, data) => api.post(`/leads/${id}/move`, data).then(r => r.data);
export const archiveLead = (id) => api.post(`/leads/${id}/archive`).then(r => r.data);
export const getLeadComments = (id) => api.get(`/leads/${id}/comments`).then(r => r.data);
export const addLeadComment = (id, body) => api.post(`/leads/${id}/comments`, { body }).then(r => r.data);
export const getLeadActivity = (id) => api.get(`/leads/${id}/activity`).then(r => r.data);
