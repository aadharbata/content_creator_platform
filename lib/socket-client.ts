import { io, Socket } from 'socket.io-client';

const URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: false,
      withCredentials: true,
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });
  }
  return socket;
};

// Allow callers to set handshake auth before connecting
export const setSocketAuth = (auth: Record<string, unknown>) => {
  const s = getSocket();
  // socket.io client supports mutating auth before connect
  (s as any).auth = { ...(s as any).auth, ...auth };
};

export const connectSocket = (auth?: Record<string, unknown>) => {
  const s = getSocket();
  if (auth) {
    (s as any).auth = { ...(s as any).auth, ...auth };
  }
  if (!s.connected) {
    s.connect();
  }
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
}; 