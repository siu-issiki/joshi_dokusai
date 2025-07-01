"use strict";
// ゲーム基本型定義
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_CODES = void 0;
// エラーコード定数
exports.ERROR_CODES = {
    // ルーム関連
    ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
    ROOM_FULL: 'ROOM_FULL',
    INVALID_PASSWORD: 'INVALID_PASSWORD',
    ALREADY_IN_ROOM: 'ALREADY_IN_ROOM',
    // ゲーム関連
    GAME_NOT_STARTED: 'GAME_NOT_STARTED',
    NOT_YOUR_TURN: 'NOT_YOUR_TURN',
    INVALID_CARD: 'INVALID_CARD',
    CARD_NOT_IN_HAND: 'CARD_NOT_IN_HAND',
    INVALID_ACTION: 'INVALID_ACTION',
    // 接続関連
    CONNECTION_ERROR: 'CONNECTION_ERROR',
    AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
};
//# sourceMappingURL=types.js.map