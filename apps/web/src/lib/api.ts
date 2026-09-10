const API_URL = 'http://localhost:3010/api/v1';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  return localStorage.getItem('baseline_token');
}

export function setToken(token: string): void {
  localStorage.setItem('baseline_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('baseline_token');
}

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const separator = path.includes('?') ? '&' : '?';
  let url = `${API_URL}${path}`;
  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (qs) url = `${url}${separator}${qs}`;
  }
  return url;
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, params, headers: customHeaders, ...rest } = options;
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(customHeaders as Record<string, string>),
  };

  const response = await fetch(buildUrl(path, params), {
    ...rest,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    removeToken();
    throw new ApiError(401, 'Unauthorized');
  }

  if (!response.ok) {
    let message = response.statusText;
    try {
      const err = await response.json();
      message = err.message ?? err.error ?? message;
    } catch {}
    throw new ApiError(response.status, message);
  }

  const json = (await response.json()) as ApiResponse<T>;
  return json.data;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) =>
    apiFetch<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiFetch<T>(path, { ...opts, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiFetch<T>(path, { ...opts, method: 'PATCH', body }),
};
