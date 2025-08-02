# Livestream Server - Refactored Architecture

This document describes the refactored architecture of the livestream server, organized into modular, maintainable components.

## Project Structure

```
src/
├── server.ts              # Main server entry point
├── index.ts               # Module exports
├── types/
│   └── index.ts          # TypeScript interfaces and types
├── config/
│   └── media.ts          # Media and server configuration
├── services/
│   ├── MediasoupService.ts   # Mediasoup worker and router management
│   ├── StreamManager.ts      # Stream lifecycle and state management
│   └── TransportManager.ts   # WebRTC transport and consumer management
├── handlers/
│   ├── ConnectionHandlers.ts # Socket connection/disconnection logic
│   ├── StreamHandlers.ts     # Stream-related socket events
│   └── MediaHandlers.ts      # Media transport and production events
└── utils/
    └── errorHandlers.ts      # Global error handling setup
```

## Architecture Overview

### Services Layer
- **MediasoupService**: Manages mediasoup worker, router, and WebRTC transport creation
- **StreamManager**: Handles stream lifecycle, viewer management, and broadcaster state
- **TransportManager**: Manages WebRTC transports and consumer lifecycle

### Handlers Layer
- **ConnectionHandlers**: Manages socket.io connections and cleanup
- **StreamHandlers**: Handles stream creation, start/stop, join/leave events
- **MediaHandlers**: Handles media transport creation, producer/consumer management

### Configuration
- **media.ts**: Centralized media codecs, transport settings, and server config

### Types
- **index.ts**: TypeScript interfaces for better type safety and documentation

## Key Benefits

1. **Separation of Concerns**: Each module has a single responsibility
2. **Testability**: Services and handlers can be unit tested independently
3. **Maintainability**: Changes to one feature don't affect others
4. **Scalability**: Easy to extend with new features
5. **Type Safety**: Strong TypeScript typing throughout
6. **Configuration Management**: Centralized settings

## Usage

The refactored code maintains 100% backward compatibility with the original implementation while providing a much cleaner and more maintainable codebase.

```typescript
// All services are initialized in server.ts
const mediasoupService = new MediasoupService();
const streamManager = new StreamManager();
const transportManager = new TransportManager();

// Handlers coordinate between services and socket events
const connectionHandlers = new ConnectionHandlers(streamManager, transportManager, io);
const streamHandlers = new StreamHandlers(streamManager, io);
const mediaHandlers = new MediaHandlers(mediasoupService, streamManager, transportManager);
```

## Error Handling

Global error handlers are set up in `utils/errorHandlers.ts` to handle unhandled rejections and uncaught exceptions gracefully.

## Future Enhancements

The modular structure makes it easy to add:
- Database persistence
- Authentication/authorization
- Stream recording
- Chat functionality
- Analytics
- Load balancing
- Horizontal scaling
