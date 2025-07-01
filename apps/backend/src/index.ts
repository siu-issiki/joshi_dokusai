import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const server = createServer(app);

// CORS設定
const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? (process.env.FRONTEND_URL || '').split(',')
    : ['http://localhost:3000'];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

// Socket.IO設定
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// 基本的なHTTPエンドポイント
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO接続処理
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // 基本的なイベントハンドラー
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  // テスト用のpingイベント
  socket.on('ping', () => {
    console.log(`Ping received from ${socket.id}`);
    socket.emit('pong', { timestamp: Date.now() });
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready`);
});
