// backend/server.ts
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

// Import services
import { MediasoupService } from './services/MediasoupService';
import { StreamManager } from './services/StreamManager';
import { TransportManager } from './services/TransportManager';
import { ChatManager } from './services/ChatManager';

// Import handlers
import { ConnectionHandlers } from './handlers/ConnectionHandlers';
import { StreamHandlers } from './handlers/StreamHandlers';
import { MediaHandlers } from './handlers/MediaHandlers';
import { ChatHandlers } from './handlers/ChatHandlers';

// Import config and utilities
import { SERVER_CONFIG } from './config/media';
import { setupGlobalErrorHandlers } from './utils/errorHandlers';

// Setup global error handlers
setupGlobalErrorHandlers();

// Initialize services
const mediasoupService = new MediasoupService();
const streamManager = new StreamManager();
const transportManager = new TransportManager();
const chatManager = new ChatManager(streamManager);

// Initialize server
const app = express();
const httpServer = http.createServer(app);

// Add health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    activeStreams: streamManager.getActiveStreams().length 
  });
});

// Add CORS headers for HTTP endpoints
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const io = new Server(httpServer, {
  cors: SERVER_CONFIG.cors,
});

// Initialize handlers
const connectionHandlers = new ConnectionHandlers(streamManager, transportManager, io, chatManager);
const streamHandlers = new StreamHandlers(streamManager, io);
const mediaHandlers = new MediaHandlers(mediasoupService, streamManager, transportManager, io);
const chatHandlers = new ChatHandlers(chatManager, streamManager, io);

// Initialize mediasoup
async function initializeServer() {
  await mediasoupService.initialize();
  console.log('Mediasoup initialized successfully');
}

// Socket.io connection handling
io.on('connection', (socket) => {
  // Handle initial connection
  const socketTransports = connectionHandlers.handleConnection(socket);
  
  // Set up all event handlers
  streamHandlers.handleCreateStream(socket);
  streamHandlers.handleStartStream(socket);
  streamHandlers.handleStopStream(socket);
  streamHandlers.handleJoinStream(socket);
  streamHandlers.handleLeaveStream(socket);
  streamHandlers.handleGetActiveStreams(socket);
  streamHandlers.handleGetStreamDebugInfo(socket);
  
  mediaHandlers.handleGetRouterRtpCapabilities(socket);
  mediaHandlers.handleCreateProducerTransport(socket);
  mediaHandlers.handleConnectProducerTransport(socket);
  mediaHandlers.handleProduce(socket);
  mediaHandlers.handleCreateConsumerTransport(socket, socketTransports);
  mediaHandlers.handleConnectConsumerTransport(socket);
  mediaHandlers.handleConsume(socket);
  mediaHandlers.handleResume(socket);
  
  // Set up chat handlers
  chatHandlers.handleJoinChat(socket);
  chatHandlers.handleLeaveChat(socket);
  chatHandlers.handleSendMessage(socket);
  chatHandlers.handleGetChatHistory(socket);
  chatHandlers.handleGetChatUsers(socket);
  chatHandlers.handleTypingIndicator(socket);
  chatHandlers.handleClearChat(socket);
  
  // Handle disconnection
  connectionHandlers.handleDisconnection(socket, socketTransports);
});

// Start server
async function startServer() {
  try {
    await initializeServer();
    httpServer.listen(SERVER_CONFIG.port, () => {
      console.log(`listening on *:${SERVER_CONFIG.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

