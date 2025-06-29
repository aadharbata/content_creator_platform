import { io } from 'socket.io-client';
import jwt from 'jsonwebtoken';

const payload = { userId: '9c515952-4ec4-49e3-876d-2d45638c281f', role: 'CONSUMER' };
const jwtSecret = 'aadhar123';
const token = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });

// Direct WebSocket connection script
const socket = io('http://localhost:3001', {
    auth: { token: token },
    transports: ['websocket', 'polling']
  });
  
  socket.on('connect', () => {
    console.log('✅ Connected to WebSocket');
    
    // Send message
    socket.emit('send_message', {
      conversationId: 'd9b5ac6b-8c5b-45f2-b78e-87c6bd0fc0de',
      content: 'Hello via WebSocket! 🚀'
    });
  });
  
  socket.on('new_message', (msg) => console.log('📨 Received:', msg));
  socket.on('message_sent', (msg) => console.log('✅ Sent:', msg));
  socket.on('connect_error', (err) => console.log('❌ Error:', err));