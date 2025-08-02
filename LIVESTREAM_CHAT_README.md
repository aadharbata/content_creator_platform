# Livestream Chat Integration

This document describes the real-time chat feature that has been integrated into the livestream platform.

## Features

### Real-time Messaging
- Instant message delivery using Socket.io WebSockets
- Support for text messages up to 500 characters
- Message history with last 100 messages stored per stream
- Auto-scroll to new messages

### User Management
- Username-based identification for chat participants
- Automatic join/leave notifications
- Live user count display
- Support for both streamers and viewers

### Moderator Features
- Stream creators automatically become chat moderators
- Moderators can clear the entire chat history
- Moderator badges displayed in chat
- System messages for moderation actions

### Interactive Features
- Typing indicators showing when users are typing
- Message timestamps
- Different message types (regular, system, moderator)
- Responsive design that works on all screen sizes

## Architecture

### Backend Components

#### ChatManager Service (`livestream/src/services/ChatManager.ts`)
- Manages chat state and message history
- Handles user join/leave operations
- Validates and processes messages
- Integrates with StreamManager for user permissions

#### ChatHandlers (`livestream/src/handlers/ChatHandlers.ts`)
- Processes all chat-related Socket.io events
- Manages chat rooms using stream IDs
- Handles real-time broadcasting of messages
- Manages user disconnections

#### Updated Types (`livestream/src/types/index.ts`)
- `ChatMessage`: Message structure with ID, content, timestamp, type
- `ChatUser`: User information including moderator status
- `SendMessageData`: Message sending request format
- `JoinChatData`: Chat join request format

### Frontend Components

#### LiveStreamChat (`components/livestream/LiveStreamChat.tsx`)
- Main chat interface component
- Handles real-time message display
- User input and message sending
- Chat user list and typing indicators

#### LiveStreamWithChat (`components/livestream/LiveStreamWithChat.tsx`)
- Integration component combining video and chat
- Socket connection management
- Demo/testing interface

## Integration Points

### Broadcaster Page (`app/livestream-broadcaster/page.tsx`)
- Two-column layout: video preview + chat
- Streamer automatically gets moderator privileges
- Chat enabled when stream is created and broadcaster name is set

### Viewer Page (`app/livestream-viewer/page.tsx`)
- Username input form for chat participation
- Two-column layout when viewing: video + chat
- Viewer name required to join chat

### Hub Page (`app/livestream-hub/page.tsx`)
- Updated feature descriptions to include chat
- Highlights real-time chat capabilities

## Socket Events

### Client to Server
- `joinChat`: Join a stream's chat room
- `leaveChat`: Leave a stream's chat room
- `sendChatMessage`: Send a message to the chat
- `getChatHistory`: Retrieve recent messages
- `getChatUsers`: Get list of chat participants
- `chatTyping`: Send typing indicator
- `clearChat`: Clear chat (moderators only)

### Server to Client
- `newChatMessage`: New message broadcast
- `userJoinedChat`: User joined notification
- `userLeftChat`: User left notification
- `userTyping`: Typing indicator update
- `chatCleared`: Chat cleared notification

## Usage Examples

### Joining Chat as Viewer
```typescript
socket.emit('joinChat', {
  streamId: 'stream-123',
  username: 'ViewerName',
  userId: 'optional-user-id'
}, (response) => {
  if (response.success) {
    // Chat joined successfully
    // response.recentMessages contains message history
    // response.chatUsers contains current users
  }
});
```

### Sending Messages
```typescript
socket.emit('sendChatMessage', {
  streamId: 'stream-123',
  message: 'Hello everyone!',
  username: 'ViewerName',
  userId: 'optional-user-id'
}, (response) => {
  if (response.success) {
    // Message sent successfully
  }
});
```

### Receiving Messages
```typescript
socket.on('newChatMessage', (data) => {
  const message = data.message;
  // Display message in chat UI
});
```

## Configuration

### Environment Variables
- `NEXT_PUBLIC_LIVESTREAM_SERVER_URL`: WebSocket server URL (defaults to http://localhost:3001)

### Message Limits
- Maximum message length: 500 characters
- Message history per stream: 100 messages
- No rate limiting implemented (can be added if needed)

## Security Considerations

- All messages are validated for length and content
- User authentication is username-based (no password protection)
- Moderator status is automatically assigned to stream creators
- No message encryption (consider adding for sensitive content)

## Future Enhancements

- Message reactions (likes, emojis)
- Private messaging between users
- User roles and permissions system
- Message filtering and auto-moderation
- Chat themes and customization
- Message search functionality
- File/image sharing capabilities
- Voice messages support

## Testing

Use the chat demo page at `/livestream-chat` to test the chat functionality:
1. Open multiple browser tabs with different usernames
2. Test real-time messaging
3. Try moderator features by checking "I am the streamer"
4. Test typing indicators and user join/leave notifications

## Dependencies

- Socket.io (client and server)
- React (frontend components)
- TypeScript (type safety)
- Next.js (React framework)
- Tailwind CSS (styling - used in chat components)
