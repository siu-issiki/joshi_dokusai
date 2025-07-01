import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);

// CORS設定
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Socket.IO設定
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://your-domain.com'] 
      : ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// 基本的なHTTPエンドポイント
app.get('/health', (req, res) => {
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
    socket.emit('pong', { timestamp: Date.now() });
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready`);
});
