import axios from 'axios';

const API_BASE = '/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('baseline_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      // Could redirect to login
    }
    return Promise.reject(err as Error);
  }
);

const unwrap = (r: { data: any }) => (r.data && typeof r.data === 'object' && 'data' in r.data && !('accessToken' in r.data) ? r.data.data : r.data);

// ─── Patient endpoints ────────────────────────────────────────────────────────
export const patientsApi = {
  list: () => api.get('/patients').then(unwrap),
  get: (id: string) => api.get(`/patients/${id}`).then(unwrap),
  getById: (id: string) => api.get(`/patients/${id}`).then(unwrap),
  summary: (id: string) => api.get(`/patients/${id}/summary`).then(unwrap),
};

export const timelineApi = {
  yearTimeline: (id: string) => api.get(`/patients/${id}/year-timeline`).then(unwrap),
  events: (id: string, year: number) =>
    api.get(`/patients/${id}/timeline`, { params: { year } }).then(unwrap),
};

export const changesApi = {
  whatChanged: (id: string) => api.get(`/change-detection/${id}/what-changed`).then(unwrap),
  brief: (id: string) => api.get(`/brief/${id}`).then(unwrap),
};

export const observationsApi = {
  list: (id: string) => api.get(`/patients/${id}/observations`).then(unwrap),
  create: (id: string, data: unknown) =>
    api.post(`/patients/${id}/observations`, data).then(unwrap),
};

export const medicationsApi = {
  list: (id: string) => api.get(`/patients/${id}/medications`).then(unwrap),
};

export const baselineApi = {
  get: (id: string) => api.get(`/baselines/patient/${id}`).then(unwrap),
};

export const episodesApi = {
  list: (id: string) => api.get(`/episodes/patient/${id}`).then(unwrap),
};

export const encountersApi = {
  list: (id: string) => api.get(`/patients/${id}/encounters`).then(unwrap),
};

export const labsApi = {
  list: (id: string) => api.get(`/patients/${id}/lab-results`).then(unwrap),
};

export const careCircleApi = {
  list: (id: string) => api.get(`/patients/${id}/care-circle`).then(unwrap),
  feed: (id: string) => api.get(`/patients/${id}/observations`).then(unwrap),
};

export const contradictionsApi = {
  list: (id: string) => api.get(`/contradictions/patient/${id}`).then(unwrap),
};

export const missingInfoApi = {
  list: (id: string) => api.get(`/missing-information/patient/${id}`).then(unwrap),
};

export const memoryApi = {
  get: (id: string) => api.get(`/memory/patient/${id}`).then(unwrap),
};

export const healthGraphApi = {
  get: (id: string) => api.get(`/health-graph/patient/${id}`).then(unwrap),
};

export const messagesApi = {
  list: () => api.get('/messages/feed').then(unwrap),
  getConversations: (userId?: string) =>
    api.get('/messages/conversations', { params: { userId } }).then(unwrap),
  getThread: (partnerId: string, userId?: string) =>
    api.get(`/messages/thread/${partnerId}`, { params: { userId } }).then(unwrap),
  send: (data: { receiverId: string; content: string; patientId?: string; attachments?: any; senderId?: string }) =>
    api.post('/messages', data).then(unwrap),
};

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data?.data ?? r.data),
  register: (data: unknown) => api.post('/auth/register', data).then(unwrap),
  me: () => api.get('/auth/me').then(unwrap),
};
