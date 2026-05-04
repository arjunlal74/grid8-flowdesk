import api from './axios.js';

export const getNotes = () => api.get('/notes').then(r => r.data);
export const createNote = (data) => api.post('/notes', data).then(r => r.data);
export const updateNote = (id, data) => api.patch(`/notes/${id}`, data).then(r => r.data);
export const deleteNote = (id) => api.delete(`/notes/${id}`);
