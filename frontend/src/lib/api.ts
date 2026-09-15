export const API_URL = typeof window !== "undefined"
  ? ""
  : (process.env.NEXT_PUBLIC_API_URL || "https://gitamitra-backend.onrender.com").replace(/\/+$/, "");
export const API_BASE = `${API_URL}/api`;


export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("gitamitra_token") || localStorage.getItem("token");
  }
  return null;
}

export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("gitamitra_token", token);
    localStorage.setItem("token", token);
  }
}

export function removeAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("gitamitra_token");
    localStorage.removeItem("token");
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export async function resilientFetch(input: RequestInfo | URL, init: RequestInit = {}, maxRetries = 6): Promise<Response> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      if (init.signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      const response = await fetch(input, init);
      if (response.status === 502 || response.status === 503 || response.status === 504) {
        throw new TypeError("Render cold start 502/503/504");
      }
      return response;
    } catch (err: any) {
      if (err.name === "AbortError" || init.signal?.aborted) {
        throw err;
      }
      const isFailedToFetch = err instanceof TypeError && 
        (err.message.includes("Failed to fetch") || err.message.includes("NetworkError") || err.message.includes("cold start"));
      
      if (isFailedToFetch && attempt < maxRetries - 1) {
        attempt++;
        const delay = 3000 * Math.pow(1.3, attempt - 1);
        console.warn(`[GitaMitra] Backend waking up... retry ${attempt}/${maxRetries} in ${(delay / 1000).toFixed(1)}s`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Unreachable");
}

export async function fetchWithAuth(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const authH = getAuthHeaders();
  const headers = {
    ...authH,
    ...(init.headers || {})
  };
  return resilientFetch(input, {
    ...init,
    headers,
    credentials: "include"
  });
}

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = "ApiError";
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const authH = getAuthHeaders();
  const headers = {
    "Content-Type": "application/json",
    ...authH,
    ...options.headers
  };

  const response = await resilientFetch(url, {
    ...options,
    headers: options.body instanceof FormData ? { ...authH, ...(options.headers || {}) } : headers,
    credentials: "include"
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { detail: response.statusText };
    }
    throw new ApiError(
      errorData.detail || errorData.message || `Request failed with status ${response.status}`,
      response.status,
      errorData
    );
  }

  // If 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Authentication
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ id: string; name: string; email: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials)
      }),
    register: (userData: { name: string; email: string; password: string }) =>
      request<{ id: string; name: string; email: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(userData)
      }),
    logout: () =>
      request<{ message: string }>("/auth/logout", {
        method: "POST"
      }),
    me: () => request<{ id: string; name: string; email: string }>("/auth/me"),
    changePassword: (payload: { current_password: string; new_password: string }) =>
      request<{ message: string }>("/auth/change-password", {
        method: "POST",
        body: JSON.stringify(payload)
      })
  },


  // Conversations
  conversations: {
    list: () =>
      request<Array<{ id: string; title: string; created_at: string; updated_at: string }>>(
        "/conversations"
      ),
    get: (id: string) =>
      request<{
        id: string;
        title: string;
        messages: Array<any>;
        created_at: string;
      }>(`/conversations/${id}`),
    create: (title?: string) =>
      request<{ id: string; title: string }>("/conversations", {
        method: "POST",
        body: JSON.stringify({ title: title || "New Dialogue" })
      }),
    rename: (id: string, title: string) =>
      request<{ id: string; title: string }>(`/conversations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title })
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/conversations/${id}`, {
        method: "DELETE"
      })
  },

  // Voice Services
  voice: {
    transcribe: (audioBlob: Blob, filename = "speech.webm") => {
      const formData = new FormData();
      formData.append("file", audioBlob, filename);
      formData.append("detect_language", "true");
      return request<{ text: string; language: string; confidence: number }>("/voice/transcribe", {
        method: "POST",
        body: formData
      });
    },
    synthesize: (text: string, voice?: string, speed?: number) => {
      return request<{ audio_base64: string; format: string; duration_estimate: number }>(
        "/voice/synthesize",
        {
          method: "POST",
          body: JSON.stringify({ text, voice, speed })
        }
      );
    },
    getSettings: () =>
      request<{
        voice_mode: string;
        auto_play: boolean;
        preferred_language: string;
        voice_persona: string;
        speed: number;
        stt_provider: string;
        tts_provider: string;
      }>("/voice/settings"),
    updateSettings: (settings: any) =>
      request<{
        voice_mode: string;
        auto_play: boolean;
        preferred_language: string;
        voice_persona: string;
        speed: number;
      }>("/voice/settings", {
        method: "PUT",
        body: JSON.stringify(settings)
      })
  },

  // Spiritual Memory Sanctuary
  memory: {
    list: (isActive = true) =>
      request<Array<any>>(`/memories?is_active=${isActive}`),
    getSettings: () =>
      request<{ user_id: string; memory_enabled: boolean }>("/memories/settings"),
    updateSettings: (memory_enabled: boolean) =>
      request<{ user_id: string; memory_enabled: boolean }>("/memories/settings", {
        method: "PUT",
        body: JSON.stringify({ memory_enabled })
      }),
    update: (id: string, data: { content?: string; importance?: number; is_active?: boolean }) =>
      request<any>(`/memories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data)
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/memories/${id}`, {
        method: "DELETE"
      }),
    clearAll: () =>
      request<{ message: string }>("/memories", {
        method: "DELETE"
      })
  },

  // Bhagavad Gita Explorer
  gita: {
    getChapters: () => request<Array<any>>("/gita/chapters"),
    getChapter: (id: number | string) => request<any>(`/gita/chapters/${id}`),
    getVerse: (chapter: number | string, verse: number | string) =>
      request<any>(`/gita/chapters/${chapter}/verses/${verse}`),
    search: (query: string, limit = 10) =>
      request<Array<any>>(`/gita/search?q=${encodeURIComponent(query)}&limit=${limit}`)
  },

  // User Feedback
  feedback: {
    submit: (payload: {
      message_id?: string;
      rating?: "up" | "down";
      category?: string;
      comment?: string;
      conversation_id?: string;
    }) =>
      request<{ message: string }>("/feedback", {
        method: "POST",
        body: JSON.stringify(payload)
      })
  }
};
