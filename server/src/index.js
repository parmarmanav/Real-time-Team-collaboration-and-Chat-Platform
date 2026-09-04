require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const app = require('./app');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

const server = http.createServer(app);

const jwt = require('jsonwebtoken');
const Message = require('./models/Message');
const User = require('./models/User');

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for dev, restrict in production
    methods: ['GET', 'POST']
  }
});

// Middleware for authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error'));
    socket.user = decoded;
    next();
  });
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.username} (${socket.id})`);

  // Join a specific channel room
  socket.on('join_channel', (channelId) => {
    socket.join(`channel:${channelId}`);
    console.log(`User ${socket.user.username} joined channel ${channelId}`);
  });

  // Handle incoming messages
  socket.on('send_message', async (data) => {
    try {
      const { channelId, content } = data;
      
      // Save message to MongoDB
      const newMessage = new Message({
        channelId,
        senderId: socket.user.id,
        content
      });
      await newMessage.save();

      // Populate sender info for the frontend
      await newMessage.populate('senderId', 'username avatarUrl status');

      // Broadcast to the channel room
      io.to(`channel:${channelId}`).emit('new_message', newMessage);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  // Online presence
  const userId = socket.user.id;
  
  // Set user online
  const setOnline = async () => {
    try {
      await User.findByIdAndUpdate(userId, { status: 'online' });
      socket.broadcast.emit('user_presence_change', { userId, status: 'online' });
    } catch (err) {
      console.error('Presence error', err);
    }
  };
  setOnline();

  // Typing indicators
  socket.on('typing_start', (channelId) => {
    socket.to(`channel:${channelId}`).emit('user_typing', {
      userId: socket.user.id,
      username: socket.user.username,
      channelId
    });
  });

  socket.on('typing_end', (channelId) => {
    socket.to(`channel:${channelId}`).emit('user_stopped_typing', {
      userId: socket.user.id,
      channelId
    });
  });

  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.user.username}`);
    try {
      await User.findByIdAndUpdate(userId, { status: 'offline', lastSeen: new Date() });
      socket.broadcast.emit('user_presence_change', { userId, status: 'offline' });
    } catch (err) {
      console.error('Presence error', err);
    }
  });
});

// Start Server & Connect to DB
const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
