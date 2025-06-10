// server.js
import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import postRoutes from './routes/postRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initSocket } from './socket/socket.js'; // Import the socket initialization

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

app.use(
  cors({
    origin: BASE_URL,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'SocioFeed Backend is running!' });
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/posts', postRoutes);
app.use('/chat', chatRoutes);
app.use(errorHandler);

// Create HTTP server from Express app
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocket(server);
console.log(io);

// Start the HTTP server
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
