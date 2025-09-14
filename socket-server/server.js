const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ["websocket", "polling"]
});

// Room management
const rooms = new Map();
const userRooms = new Map(); // socketId -> roomId mapping

// Constants matching Excalidraw client
const WS_EVENTS = {
  SERVER_VOLATILE: "server-volatile-broadcast",
  SERVER: "server-broadcast",
  USER_FOLLOW_CHANGE: "user-follow",
  USER_FOLLOW_ROOM_CHANGE: "user-follow-room-change",
};

const WS_SUBTYPES = {
  INVALID_RESPONSE: "INVALID_RESPONSE",
  INIT: "SCENE_INIT",
  UPDATE: "SCENE_UPDATE",
  MOUSE_LOCATION: "MOUSE_LOCATION",
  IDLE_STATUS: "IDLE_STATUS",
  USER_VISIBLE_SCENE_BOUNDS: "USER_VISIBLE_SCENE_BOUNDS",
};

// Room data structure
class Room {
  constructor(id) {
    this.id = id;
    this.users = new Map(); // socketId -> user info
    this.elements = []; // Current scene elements
    this.lastActivity = Date.now();
  }

  addUser(socketId, userInfo) {
    this.users.set(socketId, userInfo);
    this.lastActivity = Date.now();
    console.log(`User ${userInfo.username} joined room ${this.id}`);
  }

  removeUser(socketId) {
    const user = this.users.get(socketId);
    this.users.delete(socketId);
    this.lastActivity = Date.now();
    if (user) {
      console.log(`User ${user.username} left room ${this.id}`);
    }
    return this.users.size === 0; // Return true if room is empty
  }

  updateElements(elements, fromSocketId) {
    this.elements = elements;
    this.lastActivity = Date.now();
    
    // Broadcast to all users except sender
    return Array.from(this.users.keys()).filter(id => id !== fromSocketId);
  }

  getUserList() {
    return Array.from(this.users.values());
  }
}

// Utility functions
function getRoomId(socket) {
  const rooms = Array.from(socket.rooms);
  return rooms.find(room => room !== socket.id);
}

function broadcastToRoom(roomId, event, data, excludeSocketId = null) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.users.forEach((user, socketId) => {
    if (socketId !== excludeSocketId) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit(event, data.data, data.iv);
      }
    }
  });
}

// Socket connection handling
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Handle room joining
  socket.on('join-room', (roomId, userInfo = {}) => {
    try {
      // Leave previous room if any
      const prevRoomId = userRooms.get(socket.id);
      if (prevRoomId) {
        socket.leave(prevRoomId);
        const prevRoom = rooms.get(prevRoomId);
        if (prevRoom) {
          const isEmpty = prevRoom.removeUser(socket.id);
          if (isEmpty) {
            rooms.delete(prevRoomId);
            console.log(`Room ${prevRoomId} deleted (empty)`);
          }
        }
      }

      // Create room if it doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Room(roomId));
        console.log(`Room ${roomId} created`);
      }

      const room = rooms.get(roomId);
      
      // Join new room
      socket.join(roomId);
      userRooms.set(socket.id, roomId);
      
      room.addUser(socket.id, {
        socketId: socket.id,
        username: userInfo.username || `User_${socket.id.slice(0, 6)}`,
        ...userInfo
      });

      // Send current scene to new user
      if (room.elements.length > 0) {
        socket.emit('client-broadcast', {
          data: Buffer.from(JSON.stringify({
            type: WS_SUBTYPES.INIT,
            payload: {
              elements: room.elements
            }
          })),
          iv: new Uint8Array(16) // Dummy IV for now
        });
      }

      // Notify others about new user
      socket.to(roomId).emit(WS_EVENTS.USER_FOLLOW_ROOM_CHANGE, {
        type: 'user-joined',
        user: room.users.get(socket.id)
      });

      console.log(`Socket ${socket.id} joined room ${roomId}. Room size: ${room.users.size}`);
      
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Handle scene updates
  socket.on('server-broadcast', (encryptedData, iv) => {
    const roomId = getRoomId(socket);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    try {
      // For now, we'll pass through encrypted data
      // In production, you'd decrypt, validate, and re-encrypt
      const targetSockets = Array.from(room.users.keys()).filter(id => id !== socket.id);
      
      targetSockets.forEach(socketId => {
        const targetSocket = io.sockets.sockets.get(socketId);
        if (targetSocket) {
          targetSocket.emit('client-broadcast', encryptedData, iv);
        }
      });

      console.log(`Scene update broadcast to ${targetSockets.length} users in room ${roomId}`);
      
    } catch (error) {
      console.error('Error broadcasting scene update:', error);
    }
  });

  // Handle volatile updates (cursors, etc.)
  socket.on('server-volatile-broadcast', (encryptedData, iv) => {
    const roomId = getRoomId(socket);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    try {
      // Broadcast to all other users in room
      const targetSockets = Array.from(room.users.keys()).filter(id => id !== socket.id);
      
      targetSockets.forEach(socketId => {
        const targetSocket = io.sockets.sockets.get(socketId);
        if (targetSocket) {
          targetSocket.volatile.emit('client-broadcast', encryptedData, iv);
        }
      });
      
    } catch (error) {
      console.error('Error broadcasting volatile update:', error);
    }
  });

  // Handle user follow events
  socket.on(WS_EVENTS.USER_FOLLOW_CHANGE, (data) => {
    const roomId = getRoomId(socket);
    if (!roomId) return;

    socket.to(roomId).emit(WS_EVENTS.USER_FOLLOW_CHANGE, {
      ...data,
      socketId: socket.id
    });
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    
    const roomId = userRooms.get(socket.id);
    if (roomId) {
      const room = rooms.get(roomId);
      if (room) {
        const isEmpty = room.removeUser(socket.id);
        
        // Notify others about user leaving
        socket.to(roomId).emit(WS_EVENTS.USER_FOLLOW_ROOM_CHANGE, {
          type: 'user-left',
          socketId: socket.id
        });

        if (isEmpty) {
          rooms.delete(roomId);
          console.log(`Room ${roomId} deleted (empty)`);
        }
      }
      userRooms.delete(socket.id);
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`Socket error (${socket.id}):`, error);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    rooms: rooms.size,
    connections: io.sockets.sockets.size,
    uptime: process.uptime()
  });
});

// Room info endpoint
app.get('/rooms/:roomId', (req, res) => {
  const room = rooms.get(req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  res.json({
    id: room.id,
    userCount: room.users.size,
    users: room.getUserList(),
    lastActivity: room.lastActivity
  });
});

// Cleanup empty rooms periodically
setInterval(() => {
  const now = Date.now();
  const ROOM_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  for (const [roomId, room] of rooms.entries()) {
    if (room.users.size === 0 || (now - room.lastActivity) > ROOM_TIMEOUT) {
      rooms.delete(roomId);
      console.log(`Room ${roomId} cleaned up (timeout/empty)`);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Excalidraw Socket Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
