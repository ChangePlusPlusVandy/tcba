import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  initializeSocket,
  disconnectSocket,
  isSocketConnected,
  type TypedSocket,
} from '../config/socket';

/**
 * React hook to manage Socket.IO connection lifecycle
 *
 * Features:
 * - Automatically connects when user is authenticated
 * - Automatically disconnects when user logs out or component unmounts
 * - Provides socket instance and connection status
 *
 * @returns {Object} Socket instance and connection status
 *
 * @example
 * function MessagesPage() {
 *   const { socket, isConnected } = useSocket();
 *
 *   useEffect(() => {
 *     if (socket && isConnected) {
 *       // Listen to socket events
 *       socket.on('new_message', (data) => {
 *         console.log('New message:', data);
 *       });
 *
 *       return () => {
 *         socket.off('new_message');
 *       };
 *     }
 *   }, [socket, isConnected]);
 *
 *   return <div>...</div>;
 * }
 */
export const useSocket = () => {
  const { getToken, isSignedIn } = useAuth();
  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let mounted = true;

    const connectSocket = async () => {
      if (!isSignedIn) {
        // User not signed in, disconnect if connected
        disconnectSocket();
        setSocket(null);
        setIsConnected(false);
        return;
      }

      try {
        // Get Clerk authentication token
        const token = await getToken();

        if (!token) {
          console.error('Failed to get authentication token');
          return;
        }

        // Initialize socket connection
        const socketInstance = initializeSocket(token);

        if (mounted) {
          setSocket(socketInstance);
          setIsConnected(socketInstance.connected);

          // Listen to connection state changes
          socketInstance.on('connect', () => {
            if (mounted) {
              setIsConnected(true);
            }
          });

          socketInstance.on('disconnect', () => {
            if (mounted) {
              setIsConnected(false);
            }
          });
        }
      } catch (error) {
        console.error('Error connecting to socket:', error);
      }
    };

    connectSocket();

    // Cleanup on unmount
    return () => {
      mounted = false;
      disconnectSocket();
    };
  }, [isSignedIn, getToken]);

  return {
    socket,
    isConnected,
  };
};

/**
 * Hook to listen to specific socket event
 * Automatically handles cleanup when component unmounts
 *
 * @param eventName - Socket event name to listen to
 * @param handler - Event handler function
 *
 * @example
 * function ConversationView({ conversationId }) {
 *   useSocketEvent('new_message', (data) => {
 *     if (data.conversationId === conversationId) {
 *       // Handle new message
 *     }
 *   });
 *
 *   return <div>...</div>;
 * }
 */
export const useSocketEvent = <K extends keyof import('../types/socket').ServerToClientEvents>(
  eventName: K,
  handler: import('../types/socket').ServerToClientEvents[K]
) => {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (socket && isConnected) {
      // TypeScript workaround for event listener
      socket.on(eventName as any, handler as any);

      return () => {
        socket.off(eventName as any, handler as any);
      };
    }
  }, [socket, isConnected, eventName, handler]);
};

/**
 * Hook to check socket connection status
 * Useful for displaying connection status in UI
 *
 * @example
 * function ConnectionStatus() {
 *   const isConnected = useSocketConnectionStatus();
 *
 *   return (
 *     <div>
 *       Status: {isConnected ? 'Connected' : 'Disconnected'}
 *     </div>
 *   );
 * }
 */
export const useSocketConnectionStatus = (): boolean => {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      setConnected(isSocketConnected());
    };

    // Check immediately
    checkConnection();

    // Check periodically (every 2 seconds)
    const interval = setInterval(checkConnection, 2000);

    return () => clearInterval(interval);
  }, []);

  return connected;
};
