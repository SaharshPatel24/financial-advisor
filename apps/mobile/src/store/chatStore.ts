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
// SSE stream via XHR — React Native's fetch doesn't truly stream;
// XHR onprogress fires as each chunk arrives, giving real-time tokens.
// ---------------------------------------------------------------------------
function streamEventsXHR(
  sessionId: string,
  content: string,
  token: string,
  onEvent: (event: ChatStreamEvent) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/chat/sessions/${sessionId}/messages`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    let processedLen = 0;
    let buffer = '';

    function processChunk() {
      const raw = xhr.responseText;
      const newText = raw.slice(processedLen);
      processedLen = raw.length;
      if (!newText) return;

      buffer += newText;
      // SSE events are separated by double newline
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? ''; // last part may be incomplete — keep in buffer

      for (const part of parts) {
        if (!part.trim()) continue;
        let eventType = '';
        let dataStr = '';
        for (const line of part.split('\n')) {
          if (line.startsWith('event: ')) eventType = line.slice(7).trim();
          if (line.startsWith('data: ')) dataStr = line.slice(6).trim();
        }
        if (eventType && dataStr) {
          try {
            onEvent({ type: eventType, data: JSON.parse(dataStr) } as ChatStreamEvent);
          } catch {
            // ignore malformed events
          }
        }
      }
    }

    xhr.timeout = 60_000;
    xhr.onprogress = () => processChunk();
    xhr.onload = () => {
      processChunk(); // flush any remaining data
      resolve();
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.ontimeout = () => reject(new Error('Request timed out'));

    xhr.send(JSON.stringify({ content }));
  });
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
      await streamEventsXHR(activeSession.id, content, token, (event) => {
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
      });
    } catch {
      // stream failed — fall through to session reload below
    } finally {
      if (fullContent) {
        // Streaming worked — commit the accumulated message locally
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
        // Streaming didn't deliver tokens (e.g. Vercel buffering or redirect issue).
        // Reload the session from the API so the saved response appears immediately.
        set({ isStreaming: false, streamingContent: '', activeToolCall: null });
        await get()
          .openSession(activeSession.id)
          .catch(() => {});
      }
    }
  },
}));
