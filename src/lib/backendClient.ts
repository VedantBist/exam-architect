export interface BackendApiErrorPayload {
  code?: string;
  message?: string;
  details?: unknown;
}

export class BackendApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'BackendApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const BACKEND_MODE = (import.meta.env.VITE_BACKEND_MODE || 'local').toLowerCase();
const DEFAULT_BACKEND_URL = 'http://localhost:8080/api/v1';

export function isBackendApiMode(): boolean {
  return BACKEND_MODE === 'api';
}

export function getBackendBaseUrl(): string {
  const configured = import.meta.env.VITE_BACKEND_URL || DEFAULT_BACKEND_URL;
  return configured.endsWith('/') ? configured.slice(0, -1) : configured;
}

export function getBackendErrorMessage(error: unknown, fallback = 'Request failed'): string {
  if (error instanceof BackendApiError) {
    switch (error.code) {
      case 'AUTH_INVALID_CREDENTIALS':
        return 'Invalid email or password';
      case 'AUTH_EMAIL_EXISTS':
        return 'This email is already registered. Please sign in instead.';
      case 'AUTH_UNAUTHORIZED':
        return 'Your session is invalid. Please sign in again.';
      case 'AUTH_FORBIDDEN':
        return 'You are not allowed to perform this action.';
      case 'EXAM_NOT_FOUND':
        return 'Exam not found';
      case 'EXAM_NOT_ACTIVE':
        return 'This exam is not currently active';
      case 'ATTEMPT_NOT_FOUND':
        return 'Attempt not found';
      case 'ATTEMPT_ALREADY_SUBMITTED':
        return 'You have already completed this exam';
      case 'VALIDATION_ERROR':
        return error.message || 'Invalid request data';
      default:
        return error.message || fallback;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export async function fetchBackend<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const url = `${getBackendBaseUrl()}${path}`;

  const headers = new Headers(init.headers);

  if (!headers.has('X-User-Id')) {
    const storedAuth = localStorage.getItem('dummyAuth');
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth) as { id?: string };
        if (parsed.id) {
          headers.set('X-User-Id', parsed.id);
        }
      } catch {
        // Ignore malformed persisted auth and continue without user header.
      }
    }
  }

  if (!headers.has('Content-Type') && init.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    credentials: 'include',
    ...init,
    headers,
  });

  if (!response.ok) {
    let payload: BackendApiErrorPayload | null = null;

    try {
      payload = (await response.json()) as BackendApiErrorPayload;
    } catch {
      payload = null;
    }

    throw new BackendApiError(
      response.status,
      payload?.message || `Backend request failed (${response.status})`,
      payload?.code,
      payload?.details
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}
