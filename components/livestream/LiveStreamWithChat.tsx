// components/livestream/LiveStreamWithChat.tsx
import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { LiveStreamChat } from './LiveStreamChat';

interface LiveStreamWithChatProps {
  streamId: string;
  username: string;
  userId?: string;
  isStreamer?: boolean;
}

export const LiveStreamWithChat: React.FC<LiveStreamWithChatProps> = ({
  streamId,
  username,
  userId,
  isStreamer = false
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to the livestream server
    const newSocket = io(process.env.NEXT_PUBLIC_LIVESTREAM_SERVER_URL || 'http://localhost:3001');
    
    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to livestream server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from livestream server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  if (!socket || !isConnected) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Connecting to livestream...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-96">
      {/* Video Player Area */}
      <div className="lg:col-span-2 bg-black rounded-lg flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-4xl mb-2">📹</div>
          <p>Video Player</p>
          <p className="text-sm text-gray-300">Stream ID: {streamId}</p>
          {isStreamer && (
            <p className="text-sm text-green-400 mt-2">🔴 You are streaming</p>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="lg:col-span-1">
        <LiveStreamChat
          streamId={streamId}
          username={username}
          userId={userId}
          isStreamer={isStreamer}
          socket={socket}
        />
      </div>
    </div>
  );
};
