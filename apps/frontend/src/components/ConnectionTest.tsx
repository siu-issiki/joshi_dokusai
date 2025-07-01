'use client';

import { useState, useEffect } from 'react';
import { socketManager } from '@/lib/socket';
import { Socket } from 'socket.io-client';

interface PingResult {
  timestamp: number;
  latency: number;
  success: boolean;
}

export default function ConnectionTest() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [pingResults, setPingResults] = useState<PingResult[]>([]);
  const [isLoading, setPingLoading] = useState(false);

  useEffect(() => {
    // Socket接続を初期化
    const socketInstance = socketManager.connect();
    setSocket(socketInstance);

    // 接続状態の監視
    const handleConnect = () => {
      setIsConnected(true);
      console.log('Connected to server');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    };

    // pongイベントのリスナー
    const handlePong = (data: { timestamp: number }) => {
      const now = Date.now();
      const latency = now - data.timestamp;

      setPingResults((prev) => [
        {
          timestamp: now,
          latency,
          success: true,
        },
        ...prev.slice(0, 9), // 最新10件を保持
      ]);

      setPingLoading(false);
      console.log(`Pong received! Latency: ${latency}ms`);
    };

    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (socketInstance as any).on('pong', handlePong);

    // 初期接続状態を設定
    setIsConnected(socketInstance.connected);

    // クリーンアップ
    return () => {
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketInstance as any).off('pong', handlePong);
    };
  }, []);

  const sendPing = () => {
    if (!socket || !isConnected) {
      console.warn('Socket not connected');
      return;
    }

    setPingLoading(true);

    // タイムアウト処理
    const timeout = setTimeout(() => {
      setPingResults((prev) => [
        {
          timestamp: Date.now(),
          latency: -1,
          success: false,
        },
        ...prev.slice(0, 9),
      ]);
      setPingLoading(false);
    }, 5000);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (socket as any).emit('ping');

    // pongが返ってきたらタイムアウトをクリア
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalPongHandler = (socket as any).listeners('pong')[0];
    const wrappedPongHandler = (data: { timestamp: number }) => {
      clearTimeout(timeout);
      if (originalPongHandler) originalPongHandler(data);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (socket as any).off('pong');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (socket as any).on('pong', wrappedPongHandler);
  };

  const connect = () => {
    const socketInstance = socketManager.connect();
    setSocket(socketInstance);
  };

  const disconnect = () => {
    socketManager.disconnect();
    setIsConnected(false);
  };

  const getStatusColor = () => {
    if (isConnected) return 'text-green-600';
    return 'text-red-600';
  };

  const getStatusText = () => {
    if (isConnected) return '接続済み';
    return '未接続';
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Socket.io 接続テスト
      </h2>

      {/* 接続状態 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-700">接続状態</h3>
            <p className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </p>
            {socket?.id && (
              <p className="text-xs text-gray-500 mt-1">
                Socket ID: {socket.id}
              </p>
            )}
          </div>
          <div className="space-x-2">
            {!isConnected ? (
              <button
                onClick={connect}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                接続
              </button>
            ) : (
              <button
                onClick={disconnect}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                切断
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ping テスト */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Ping テスト</h3>
          <button
            onClick={sendPing}
            disabled={!isConnected || isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Ping中...' : 'Ping送信'}
          </button>
        </div>

        {/* Ping結果 */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {pingResults.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Pingボタンを押してテストを開始してください
            </p>
          ) : (
            pingResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded border-l-4 ${
                  result.success
                    ? 'bg-green-50 border-green-400'
                    : 'bg-red-50 border-red-400'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                  <span
                    className={`font-medium ${
                      result.success ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {result.success ? `${result.latency}ms` : 'タイムアウト'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 統計情報 */}
      {pingResults.length > 0 && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">統計情報</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-600">成功率:</span>
              <span className="ml-1 font-medium">
                {Math.round(
                  (pingResults.filter((r) => r.success).length /
                    pingResults.length) *
                    100
                )}
                %
              </span>
            </div>
            <div>
              <span className="text-blue-600">平均レイテンシ:</span>
              <span className="ml-1 font-medium">
                {Math.round(
                  pingResults
                    .filter((r) => r.success)
                    .reduce((sum, r) => sum + r.latency, 0) /
                    pingResults.filter((r) => r.success).length || 0
                )}
                ms
              </span>
            </div>
            <div>
              <span className="text-blue-600">テスト回数:</span>
              <span className="ml-1 font-medium">{pingResults.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
