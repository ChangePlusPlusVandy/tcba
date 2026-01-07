import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../types/socket';

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

export const initializeSocket = (token: string): TypedSocket => {
  if (socket && socket.connected) {
    return socket;
  }
  if (socket) {
    socket.disconnect();
  }

  const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('Socket.IO connected:', socket?.id);
  });

  socket.on('disconnect', reason => {
    console.log('Socket.IO disconnected:', reason);
  });

  socket.on('connect_error', error => {
    console.error('Socket.IO connection error:', error.message);
  });

  socket.on('error', data => {
    console.error('Socket.IO error:', data.message);
  });

  return socket;
};

/**
 * Get the current socket instance
 * Returns null if socket is not initialized
 */
export const getSocket = (): TypedSocket | null => {
  return socket;
};

/**
 * Disconnect and cleanup socket connection
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Check if socket is connected
 */
export const isSocketConnected = (): boolean => {
  return socket?.connected ?? false;
};

/**
 * Join a conversation room to receive real-time updates
 */
export const joinConversation = (conversationId: string): void => {
  if (socket && socket.connected) {
    socket.emit('join_conversation', { conversationId });
  }
};

/**
 * Leave a conversation room
 */
export const leaveConversation = (conversationId: string): void => {
  if (socket && socket.connected) {
    socket.emit('leave_conversation', { conversationId });
  }
};

/**
 * Send a message via socket (should also be sent via REST API)
 */
export const sendMessageViaSocket = (
  conversationId: string,
  content: string,
  attachments?: string[]
): void => {
  if (socket && socket.connected) {
    socket.emit('send_message', { conversationId, content, attachments });
  }
};

/**
 * Mark messages as read
 */
export const markAsReadViaSocket = (conversationId: string): void => {
  if (socket && socket.connected) {
    socket.emit('mark_as_read', { conversationId });
  }
};

/**
 * Send typing indicator
 */
export const sendTypingIndicator = (conversationId: string, isTyping: boolean): void => {
  if (socket && socket.connected) {
    socket.emit('typing', { conversationId, isTyping });
  }
};
