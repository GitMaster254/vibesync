import { Track } from './db';

interface WebSocketMessage {
  type: 'SYNC_PLAYBACK' | 'JOIN_PARTY' | 'LEAVE_PARTY' | 'CHAT_MESSAGE' | 'PLAYLIST_UPDATE';
  payload: any;
  timestamp: number;
  userId: string;
  roomId?: string;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<(message: WebSocketMessage) => void>> = new Map();
  private roomId: string | null = null;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  connect(url: string = 'https://metadata-42b8.onrender.com/') {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      if (this.roomId) {
        this.joinRoom(this.roomId);
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect();
    }, 1000 * Math.pow(2, this.reconnectAttempts));
  }

  private handleMessage(message: WebSocketMessage) {
    const listeners = this.listeners.get(message.type) || new Set();
    listeners.forEach(listener => listener(message));
  }

  addEventListener(type: WebSocketMessage['type'], callback: (message: WebSocketMessage) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)?.add(callback);
  }

  removeEventListener(type: WebSocketMessage['type'], callback: (message: WebSocketMessage) => void) {
    this.listeners.get(type)?.delete(callback);
  }

  // Listening Party Features
  joinRoom(roomId: string) {
    this.roomId = roomId;
    this.sendMessage({
      type: 'JOIN_PARTY',
      payload: { roomId },
      timestamp: Date.now(),
      userId: this.userId,
    });
  }

  leaveRoom() {
    if (this.roomId) {
      this.sendMessage({
        type: 'LEAVE_PARTY',
        payload: { roomId: this.roomId },
        timestamp: Date.now(),
        userId: this.userId,
      });
      this.roomId = null;
    }
  }

  syncPlayback(track: Track, position: number, isPlaying: boolean) {
    if (!this.roomId) return;

    this.sendMessage({
      type: 'SYNC_PLAYBACK',
      payload: {
        track,
        position,
        isPlaying,
        roomId: this.roomId,
      },
      timestamp: Date.now(),
      userId: this.userId,
    });
  }

  updatePlaylist(playlistId: string, tracks: Track[]) {
    this.sendMessage({
      type: 'PLAYLIST_UPDATE',
      payload: {
        playlistId,
        tracks,
        roomId: this.roomId,
      },
      timestamp: Date.now(),
      userId: this.userId,
    });
  }

  private sendMessage(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
    this.roomId = null;
  }
}

// Create a singleton instance
let wsService: WebSocketService | null = null;

export function initializeWebSocket(userId: string) {
  if (!wsService) {
    wsService = new WebSocketService(userId);
  }
  return wsService;
}

export function getWebSocketService() {
  if (!wsService) {
    throw new Error('WebSocket service not initialized');
  }
  return wsService;
}