export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");
export const API_BASE = `${API_URL}/api`;


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
  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers: options.body instanceof FormData ? (options.headers || {}) : headers,
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
