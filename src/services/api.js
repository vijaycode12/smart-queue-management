import axios from 'axios';

const BASE_URL = 'https://smart-queue-backend-u0l0.onrender.com';

const api = axios.create({ baseURL: BASE_URL });

// Auth
export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);

// Queue
export const getAllQueues = () => api.get('/queue/all');
export const createQueue = (data, role) =>
  api.post('/queue/create', data, { headers: { role } });

// Token
export const generateToken = (queueId, userId, role) =>
  api.post(`/token/generate/${queueId}`, {}, { headers: { userId, role } });

export const getAllTokens = (role) =>
  api.get('/token/all', { headers: { role } });

export const getWaitingTokens = () => api.get('/token/waiting');

export const getTokensByQueue = (queueId) =>
  api.get(`/token/queue/${queueId}`);

export const getQueuePosition = (tokenId, userId) =>
  api.get(`/token/position/${tokenId}`, { headers: { userId } });

export const getWaitTime = (tokenId) =>
  api.get(`/token/wait-time/${tokenId}`);

export const callNextToken = (queueId, role) =>
  api.put(`/token/call-next/${queueId}`, {}, { headers: { role } });

export const completeToken = (id, role) =>
  api.put(`/token/complete/${id}`, {}, { headers: { role } });

export const markNoShow = (id, role) =>
  api.put(`/token/no-show/${id}`, {}, { headers: { role } });

export const updateQueueStatus = (id, status, role) =>
  api.put(`/queue/update-status/${id}`, {}, { headers: { role }});

export const deleteQueue = (id, role) =>
  api.delete(`/queue/delete/${id}`, { headers: { role } });