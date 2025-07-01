"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// CORS設定
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://your-domain.com']
        : ['http://localhost:3000'],
    credentials: true
}));
app.use(express_1.default.json());
// Socket.IO設定
const io = new socket_io_1.Server(server, {
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
//# sourceMappingURL=index.js.map