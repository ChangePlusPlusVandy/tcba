import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from '@clerk/express';

let io: SocketIOServer | null = null;

/**
 * Call this function in server.ts after creating the HTTP server
 */
export const initializeSocket = (httpServer: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify Clerk token
      const verified = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
        clockSkewInMs: 5000,
      });

      if (!verified) {
        return next(new Error('Invalid authentication token'));
      }

      socket.data.userId = verified.sub;
      socket.data.sessionId = verified.sid;

      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.data.userId} (Socket: ${socket.id})`);

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.data.userId} (Socket: ${socket.id})`);
    });

    // Uncomment and implement these handlers as needed

    /*
    // Join a conversation room
    socket.on('join_conversation', (data: { conversationId: string }) => {
      socket.join(`conversation:${data.conversationId}`);
      console.log(`User ${socket.data.userId} joined conversation ${data.conversationId}`);
    });

    // Leave a conversation room
    socket.on('leave_conversation', (data: { conversationId: string }) => {
      socket.leave(`conversation:${data.conversationId}`);
      console.log(`User ${socket.data.userId} left conversation ${data.conversationId}`);
    });

    // Send message event (you'll also save to DB in the controller)
    socket.on('send_message', async (data: { conversationId: string; content: string }) => {
      try {
        // Verify user is part of this conversation (check DB)
        // Save message to database via controller
        // Then emit to all users in the conversation room
        io?.to(`conversation:${data.conversationId}`).emit('new_message', {
          conversationId: data.conversationId,
          message: {
            // message data from DB
          }
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Mark messages as read
    socket.on('mark_as_read', async (data: { conversationId: string }) => {
      try {
        // Update DB to mark messages as read
        // Emit to conversation room
        io?.to(`conversation:${data.conversationId}`).emit('messages_read', {
          conversationId: data.conversationId,
          userId: socket.data.userId,
          readAt: new Date().toISOString()
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to mark as read' });
      }
    });
    */
  });

  return io;
};

export const getSocketIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket() first.');
  }
  return io;
};

export const emitToConversation = (
  conversationId: string,
  event: string,
  data: any
): void => {
  if (io) {
    io.to(`conversation:${conversationId}`).emit(event, data);
  }
};


export const emitToUser = (userId: string, event: string, data: any): void => {
  // Implement userId -> socketId mapping
  // You can store this mapping when users connect
  // For now, this is a placeholder
  console.warn('emitToUser not fully implemented. Needs userId -> socketId mapping.');
};
