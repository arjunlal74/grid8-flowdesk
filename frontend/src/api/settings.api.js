import api from './axios.js';

export const getSettings = () => api.get('/settings').then(r => r.data);
export const updateSettings = (data) => api.patch('/settings', data).then(r => r.data);

export const getLeadStatuses = () => api.get('/settings/lead-statuses').then(r => r.data);
export const createLeadStatus = (data) => api.post('/settings/lead-statuses', data).then(r => r.data);
export const updateLeadStatus = (id, data) => api.patch(`/settings/lead-statuses/${id}`, data).then(r => r.data);
export const reorderLeadStatuses = (ids) => api.patch('/settings/lead-statuses/reorder', { ids }).then(r => r.data);

export const getTaskStatuses = () => api.get('/settings/task-statuses').then(r => r.data);
export const createTaskStatus = (data) => api.post('/settings/task-statuses', data).then(r => r.data);
export const updateTaskStatus = (id, data) => api.patch(`/settings/task-statuses/${id}`, data).then(r => r.data);
export const reorderTaskStatuses = (ids) => api.patch('/settings/task-statuses/reorder', { ids }).then(r => r.data);

export const getCategories = () => api.get('/settings/categories').then(r => r.data);
export const createCategory = (data) => api.post('/settings/categories', data).then(r => r.data);
export const updateCategory = (id, data) => api.patch(`/settings/categories/${id}`, data).then(r => r.data);

export const getTags = () => api.get('/settings/tags').then(r => r.data);
export const createTag = (data) => api.post('/settings/tags', data).then(r => r.data);
export const updateTag = (id, data) => api.patch(`/settings/tags/${id}`, data).then(r => r.data);
export const deleteTag = (id) => api.delete(`/settings/tags/${id}`);
