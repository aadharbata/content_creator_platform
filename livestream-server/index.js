import http from 'http';
import { Server } from 'socket.io';

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// In-memory room state
const rooms = {};

io.of('/stream').on('connection', (socket) => {
  socket.on('join', ({ roomId, role }) => {
    socket.join(roomId);
    socket.data.role = role;
    socket.data.roomId = roomId;
    if (!rooms[roomId]) rooms[roomId] = { creator: null, audiences: [] };
    if (role === 'creator') {
      rooms[roomId].creator = socket.id;
    } else {
      rooms[roomId].audiences.push(socket.id);
      // Notify creator that a new audience joined
      if (rooms[roomId].creator) {
        io.of('/stream').to(rooms[roomId].creator).emit('audience-joined', { audienceId: socket.id });
      }
    }
  });

  // WebRTC signaling
  socket.on('offer', ({ to, offer }) => {
    io.of('/stream').to(to).emit('offer', { from: socket.id, offer });
  });
  socket.on('answer', ({ to, answer }) => {
    io.of('/stream').to(to).emit('answer', { from: socket.id, answer });
  });
  socket.on('candidate', ({ to, candidate }) => {
    io.of('/stream').to(to).emit('candidate', { from: socket.id, candidate });
  });

  // Audience interactions
  socket.on('like', ({ roomId }) => {
    io.of('/stream').to(roomId).emit('like');
  });
  socket.on('comment', ({ roomId, data }) => {
    io.of('/stream').to(roomId).emit('comment', data);
  });
  socket.on('tip', ({ roomId, data }) => {
    io.of('/stream').to(roomId).emit('tip', data);
  });

  socket.on('disconnect', () => {
    const { roomId, role } = socket.data;
    if (roomId && rooms[roomId]) {
      if (role === 'creator') {
        // End stream for all
        io.of('/stream').to(roomId).emit('stream-ended');
        delete rooms[roomId];
      } else {
        rooms[roomId].audiences = rooms[roomId].audiences.filter(id => id !== socket.id);
      }
    }
  });
});

server.listen(4000, () => {
  console.log('WebSocket server listening on port 4000');
});