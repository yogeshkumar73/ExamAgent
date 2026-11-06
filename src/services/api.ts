/**
 * SkillArena AI — Production Frontend API Service
 * Connects directly to the FastAPI Backend (/api/v1) with JWT authentication and Anonymous Guest header.
 */

const API_BASE = '/api/v1';

export function getAuthToken(): string | null {
  return localStorage.getItem('skillarena_auth_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('skillarena_auth_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('skillarena_auth_token');
}

export function getAnonymousId(): string {
  let anonId = localStorage.getItem('skillarena_anon_id');
  if (!anonId) {
    anonId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `anon-${Date.now()}`;
    localStorage.setItem('skillarena_anon_id', anonId);
  }
  return anonId;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Multi-user & anonymous security headers
  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('x-anonymous-id', getAnonymousId());

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Authentication & Multi-User
  auth: {
    register: (data: { username: string; email: string; password: string }) =>
      request<{ access_token: string; user_id: string; username: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    login: (data: { username_or_email: string; password: string }) =>
      request<{ access_token: string; user_id: string; username: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getMe: () =>
      request<{ id: string; username: string; email: string; role: string; is_authenticated: boolean }>('/auth/me'),
    anonymous: () =>
      request<{ access_token: string; user_id: string; username: string }>('/auth/anonymous', {
        method: 'POST',
      }),
  },

  // Content Input & Analyzer
  content: {
    analyze: (data: { text: string; title?: string }) =>
      request<{ content_id: string; title: string; content_hash: string; topics: string[]; chunk_count: number }>('/content/analyze', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    upload: (file: File, title?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      if (title) formData.append('title', title);
      return request<{ content_id: string; title: string; content_hash: string; topics: string[]; chunk_count: number }>('/content/upload', {
        method: 'POST',
        body: formData,
      });
    },
    getTopics: (contentId: string) =>
      request<{ content_id: string; topics: string[] }>(`/content/${contentId}/topics`),
  },

  // Questions
  questions: {
    generate: (params: {
      content_id?: string;
      topics?: string[];
      question_count?: number;
      difficulty?: string;
      question_types?: string[];
      context_text?: string;
    }) =>
      request<{ success: boolean; count: number; data: any[] }>('/questions/generate', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    getById: (questionId: string) =>
      request<any>(`/questions/${questionId}`),
  },

  // Sessions & 5-Part Rubric Evaluation
  sessions: {
    start: (params: {
      content_id?: string;
      topics?: string[];
      difficulty?: string;
      total_questions?: number;
      anonymous_id?: string;
    }) =>
      request<{ success: boolean; session_id: string; total_questions: number; difficulty: string }>('/sessions/start', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    submit: (sessionId: string, params: {
      question_id: string;
      user_answer: string;
      response_time_ms?: number;
    }) =>
      request<{ success: boolean; data: any }>((`/sessions/${sessionId}/submit`), {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId, ...params }),
      }),
    getResult: (sessionId: string) =>
      request<any>(`/sessions/${sessionId}/result`),
  },

  // Analytics & Adaptive ML
  analytics: {
    getSummary: (identifier: string) =>
      request<any>(`/analytics/${identifier}/summary`),
    getWeakTopics: (identifier: string) =>
      request<any[]>(`/analytics/${identifier}/weak-topics`),
    getRecommendations: (identifier: string) =>
      request<any[]>(`/analytics/${identifier}/recommendations`),
    getSessionAnalytics: (sessionId: string) =>
      request<any>(`/analytics/session/${sessionId}`),
  },

  // Gamification & Daily Quests
  gamification: {
    getProfile: (identifier: string) =>
      request<any>(`/gamification/${identifier}`),
    getQuests: () =>
      request<any[]>('/gamification/quests'),
    claimQuest: (questId: string) =>
      request<{ success: boolean; reward_xp: number; new_total_xp: number; message: string }>(`/gamification/quests/${questId}/claim`, {
        method: 'POST',
      }),
    getLeaderboard: () =>
      request<{ period: string; count: number; data: any[] }>('/leaderboard/daily'),
  },

  // Progress Management
  progress: {
    export: () => request<any>('/progress/export', { method: 'POST' }),
    import: (data: any) => request<any>('/progress/import', { method: 'POST', body: JSON.stringify(data) }),
    delete: (identifier: string) => request<any>(`/progress/${identifier}`, { method: 'DELETE' }),
  },

  // System Health
  health: () => request<{ status: string; database: string; cache: string; ai_provider: string }>('/health'),
};
