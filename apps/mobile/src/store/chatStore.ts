import { create } from 'zustand';
import type {
  ChatSessionSummary,
  ChatSessionDetail,
  ChatStreamEvent,
  ChatMessageDto,
} from '@financial-advisor/shared';
import { API_URL } from '../services/api';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------
interface ChatState {
  sessions: ChatSessionSummary[];
  activeSession: ChatSessionDetail | null;
  streamingContent: string;
  isStreaming: boolean;
  activeToolCall: string | null;
  loadSessions: () => Promise<void>;
  openSession: (id: string) => Promise<void>;
  resetActiveSession: () => void;
  sendMessage: (content: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Auth token helper (lazy require avoids circular import)
// ---------------------------------------------------------------------------
function getToken(): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useAuthStore } = require('./authStore') as typeof import('./authStore');
  return useAuthStore.getState().tokens?.accessToken ?? '';
}

// ---------------------------------------------------------------------------
// SSE stream helper
// ---------------------------------------------------------------------------
async function* streamEvents(
  sessionId: string,
  content: string,
  token: string,
): AsyncGenerator<ChatStreamEvent> {
  const res = await fetch(`${API_URL}/chat/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });

  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';

    for (const part of parts) {
      let eventType = '';
      let dataStr = '';
      for (const line of part.split('\n')) {
        if (line.startsWith('event: ')) eventType = line.slice(7).trim();
        if (line.startsWith('data: ')) dataStr = line.slice(6).trim();
      }
      if (eventType && dataStr) {
        try {
          yield { type: eventType, data: JSON.parse(dataStr) } as ChatStreamEvent;
        } catch {
          // ignore malformed events
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export const useChatStore = create<ChatState>()((set, get) => ({
  sessions: [],
  activeSession: null,
  streamingContent: '',
  isStreaming: false,
  activeToolCall: null,

  loadSessions: async () => {
    const token = getToken();
    const res = await fetch(`${API_URL}/chat/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const sessions: ChatSessionSummary[] = await res.json();
      set({ sessions });
    }
  },

  openSession: async (id) => {
    const token = getToken();
    const res = await fetch(`${API_URL}/chat/sessions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const session: ChatSessionDetail = await res.json();
      set({ activeSession: session });
    }
  },

  resetActiveSession: () =>
    set({ activeSession: null, streamingContent: '', isStreaming: false, activeToolCall: null }),

  sendMessage: async (content) => {
    const token = getToken();
    let { activeSession } = get();

    // Create session if none exists
    if (!activeSession) {
      const res = await fetch(`${API_URL}/chat/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error('Failed to create session');
      const created: ChatSessionSummary = await res.json();
      activeSession = { ...created, messages: [] };
      set({ activeSession, sessions: [created, ...get().sessions] });
    }

    // Optimistically add user message
    const userMsg: ChatMessageDto = {
      id: `tmp-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({
      activeSession: s.activeSession
        ? { ...s.activeSession, messages: [...s.activeSession.messages, userMsg] }
        : null,
      isStreaming: true,
      streamingContent: '',
      activeToolCall: null,
    }));

    let fullContent = '';
    let doneMessageId = '';

    try {
      for await (const event of streamEvents(activeSession.id, content, token)) {
        if (event.type === 'token') {
          fullContent += event.data.content;
          set({ streamingContent: fullContent });
        } else if (event.type === 'tool_call') {
          set({ activeToolCall: event.data.tool });
        } else if (event.type === 'tool_result') {
          set({ activeToolCall: null });
        } else if (event.type === 'done') {
          doneMessageId = event.data.messageId;
        }
      }
    } finally {
      if (fullContent) {
        const aiMsg: ChatMessageDto = {
          id: doneMessageId || `ai-${Date.now()}`,
          role: 'assistant',
          content: fullContent,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          activeSession: s.activeSession
            ? { ...s.activeSession, messages: [...s.activeSession.messages, aiMsg] }
            : null,
          isStreaming: false,
          streamingContent: '',
          activeToolCall: null,
        }));
      } else {
        set({ isStreaming: false, streamingContent: '', activeToolCall: null });
      }
    }
  },
}));
