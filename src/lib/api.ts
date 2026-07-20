// Mirrors backend/app/schemas.py. Requests go to relative /api/... paths -- the Vite dev
// server proxies them to the FastAPI backend (see vite.config.ts), and in a built/served
// deployment the same relative path works as long as the backend is reachable at /api on
// whatever host serves the frontend.

export interface ConfigResponse {
  accounts: string[]
  recommended_models: string[]
  default_model: string
  default_retries: number
}

export interface RunCreateRequest {
  assessment_url: string
  headless: boolean
  test_account_label: string
  model?: string | null
  max_retries: number
  note?: string | null
}

export interface QuestionAttempt {
  attempt: number
  code: string
  err?: string | null
}

export interface Question {
  id: number
  type?: 'MCQ' | 'CODING'
  text?: string
  status?: 'PASSED' | 'FAILED'
  start?: number
  dur?: number
  opts?: string[]
  ans?: string
  code?: string
  lang?: string
  attempts?: QuestionAttempt[]
}

export interface TimelineEvent {
  t: string
  e: string
}

export interface Telemetry {
  meta: {
    start?: number
    user?: string
    sections?: number
    questions?: number
    pass?: number
    fail?: number
  }
  timeline: TimelineEvent[]
  questions: Question[]
}

export type RunStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface RunView {
  id: string
  assessment_url: string
  headless: boolean
  test_account_label: string
  model: string
  max_retries: number
  output_dir: string
  status: RunStatus
  error?: string | null
  created_at: number
  started_at?: number | null
  finished_at?: number | null
  created_at_fmt?: string | null
  started_at_fmt?: string | null
  finished_at_fmt?: string | null
  queue_position?: number | null
  telemetry?: Telemetry | null
  created_by?: string | null
  note?: string | null
}

export interface Me {
  name: string
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // send the session cookie along with every request
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(res.status, body?.detail || `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  login: (name: string, password: string) =>
    request<Me>('/auth/login', { method: 'POST', body: JSON.stringify({ name, password }) }),
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  me: () => request<Me>('/auth/me'),
  getConfig: () => request<ConfigResponse>('/config'),
  createRun: (body: RunCreateRequest) =>
    request<{ id: string }>('/runs', { method: 'POST', body: JSON.stringify(body) }),
  listRuns: () => request<RunView[]>('/runs'),
  getRun: (id: string) => request<RunView>(`/runs/${id}`),
  cancelRun: (id: string) => request<{ ok: boolean }>(`/runs/${id}/cancel`, { method: 'POST' }),
}
