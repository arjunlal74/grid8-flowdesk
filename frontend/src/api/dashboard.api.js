import api from './axios.js';

export const getStats = (range) => api.get('/dashboard/stats', { params: { range } }).then(r => r.data);
export const getPipeline = () => api.get('/dashboard/pipeline').then(r => r.data);
export const getActivity = () => api.get('/dashboard/activity').then(r => r.data);
export const getChart = (metric, range) => api.get('/dashboard/chart', { params: { metric, range } }).then(r => r.data);
export const getMyDashboard = () => api.get('/dashboard/me').then(r => r.data);
