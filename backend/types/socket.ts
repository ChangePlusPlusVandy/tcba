/**
 * Socket.IO Event Type Definitions
 * These interfaces define the structure of events exchanged between client and server
 */

// ==========================================
// CLIENT TO SERVER EVENTS
// ==========================================

export interface ClientToServerEvents {
  // Join a conversation room to receive real-time updates
  join_conversation: (data: JoinConversationPayload) => void;

  // Leave a conversation room
  leave_conversation: (data: LeaveConversationPayload) => void;

  // Send a message (note: also saved via REST API, socket for real-time delivery)
  send_message: (data: SendMessagePayload) => void;

  // Mark messages in a conversation as read
  mark_as_read: (data: MarkAsReadPayload) => void;

  // Typing indicator (optional feature)
  typing: (data: TypingPayload) => void;
}

// ==========================================
// SERVER TO CLIENT EVENTS
// ==========================================

export interface ServerToClientEvents {
  // New message received in a conversation
  new_message: (data: NewMessageEvent) => void;

  // Messages marked as read by another user
  messages_read: (data: MessagesReadEvent) => void;

  // Unread count updated for current user
  unread_count_update: (data: UnreadCountEvent) => void;

  // User typing in a conversation (optional)
  user_typing: (data: UserTypingEvent) => void;

  // Error event
  error: (data: ErrorEvent) => void;

  // Connection status events
  connect: () => void;
  disconnect: () => void;
}

// ==========================================
// EVENT PAYLOAD INTERFACES
// ==========================================

// Client -> Server Payloads

export interface JoinConversationPayload {
  conversationId: string;
}

export interface LeaveConversationPayload {
  conversationId: string;
}

export interface SendMessagePayload {
  conversationId: string;
  content: string;
  attachments?: string[];
}

export interface MarkAsReadPayload {
  conversationId: string;
}

export interface TypingPayload {
  conversationId: string;
  isTyping: boolean;
}

// Server -> Client Event Data

export interface NewMessageEvent {
  conversationId: string;
  message: MessageData;
}

export interface MessagesReadEvent {
  conversationId: string;
  userId: string;
  readAt: string; // ISO date string
}

export interface UnreadCountEvent {
  count: number;
}

export interface UserTypingEvent {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface ErrorEvent {
  message: string;
  code?: string;
}

// ==========================================
// SHARED DATA STRUCTURES
// ==========================================

export interface MessageData {
  id: string;
  conversationId: string;
  senderType: 'ORG' | 'ADMIN';
  senderOrganizationId?: string;
  senderAdminId?: string;
  content: string;
  attachments: string[];
  status: 'SENT' | 'DELIVERED' | 'READ';
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationData {
  id: string;
  type: 'ORG_TO_ORG' | 'ORG_TO_ADMIN' | 'ADMIN_TO_ORG';
  organizationId?: string;
  adminId?: string;
  otherOrganizationId?: string;
  subject: string;
  lastMessageAt: string;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SocketData {
  userId: string;
  sessionId: string;
}

import { Server, Socket } from 'socket.io';

export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;

export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;
