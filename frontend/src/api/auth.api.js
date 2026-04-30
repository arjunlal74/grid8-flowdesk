import api from './axios.js';

export const login = (data) => api.post('/auth/login', data).then(r => r.data);
export const me = () => api.get('/auth/me').then(r => r.data);
