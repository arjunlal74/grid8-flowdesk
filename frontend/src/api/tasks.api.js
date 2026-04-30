import api from './axios.js';

export const getTasks = (params) => api.get('/tasks', { params }).then(r => r.data);
export const getTask = (id) => api.get(`/tasks/${id}`).then(r => r.data);
export const createTask = (data) => api.post('/tasks', data).then(r => r.data);
export const updateTask = (id, data) => api.patch(`/tasks/${id}`, data).then(r => r.data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);
export const moveTask = (id, data) => api.post(`/tasks/${id}/move`, data).then(r => r.data);
export const completeTask = (id) => api.post(`/tasks/${id}/complete`).then(r => r.data);
export const getTaskComments = (id) => api.get(`/tasks/${id}/comments`).then(r => r.data);
export const addTaskComment = (id, body) => api.post(`/tasks/${id}/comments`, { body }).then(r => r.data);
