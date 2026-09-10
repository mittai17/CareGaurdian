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

// ─── Patient endpoints ────────────────────────────────────────────────────────
export const patientsApi = {
  list: () => api.get('/patients').then((r) => r.data),
  get: (id: string) => api.get(`/patients/${id}`).then((r) => r.data),
  summary: (id: string) => api.get(`/patients/${id}/summary`).then((r) => r.data),
};

export const timelineApi = {
  yearTimeline: (id: string) => api.get(`/timeline/${id}/year-timeline`).then((r) => r.data),
  events: (id: string, year: number) =>
    api.get(`/timeline/${id}/events`, { params: { year } }).then((r) => r.data),
};

export const changesApi = {
  whatChanged: (id: string) => api.get(`/change-detection/${id}/what-changed`).then((r) => r.data),
  brief: (id: string) => api.get(`/brief/${id}`).then((r) => r.data),
};

export const observationsApi = {
  list: (id: string) => api.get(`/observations/patient/${id}`).then((r) => r.data),
  create: (id: string, data: unknown) =>
    api.post(`/observations/patient/${id}`, data).then((r) => r.data),
};

export const medicationsApi = {
  list: (id: string) => api.get(`/medications/patient/${id}`).then((r) => r.data),
};

export const baselineApi = {
  get: (id: string) => api.get(`/baselines/patient/${id}`).then((r) => r.data),
};

export const episodesApi = {
  list: (id: string) => api.get(`/episodes/patient/${id}`).then((r) => r.data),
};

export const careCircleApi = {
  list: (id: string) => api.get(`/patients/${id}/care-circle`).then((r) => r.data),
  feed: (id: string) => api.get(`/observations/patient/${id}`).then((r) => r.data),
};

export const contradictionsApi = {
  list: (id: string) => api.get(`/contradictions/patient/${id}`).then((r) => r.data),
};

export const missingInfoApi = {
  list: (id: string) => api.get(`/missing-information/patient/${id}`).then((r) => r.data),
};

export const memoryApi = {
  get: (id: string) => api.get(`/memory/patient/${id}`).then((r) => r.data),
};

export const healthGraphApi = {
  get: (id: string) => api.get(`/health-graph/patient/${id}`).then((r) => r.data),
};

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),
  register: (data: unknown) => api.post('/auth/register', data).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};
