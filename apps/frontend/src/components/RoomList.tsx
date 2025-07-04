'use client';

import React, { useState } from 'react';
import { FirebaseRoom } from '@joshi-dokusai/shared';
import { useRoomList, useRoomFilter } from '@/hooks/useRoomList';

interface RoomListProps {
  onJoinRoom: (roomId: string, password?: string) => void;
  onCreateRoom: () => void;
  loading?: boolean;
}

/**
 * ルーム一覧表示コンポーネント
 * 利用可能なルームの一覧表示と参加機能を提供
 */
export default function RoomList({
  onJoinRoom,
  onCreateRoom,
  loading: externalLoading = false,
}: RoomListProps) {
  const { rooms, loading, error, connected, refreshRooms } = useRoomList();
  const {
    searchTerm,
    setSearchTerm,
    showPrivateRooms,
    setShowPrivateRooms,
    maxPlayersFilter,
    setMaxPlayersFilter,
    filteredRooms,
  } = useRoomFilter(rooms);

  const [selectedRoom, setSelectedRoom] = useState<FirebaseRoom | null>(null);
  const [password, setPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleJoinRoom = (room: FirebaseRoom) => {
    if (room.isPrivate) {
      setSelectedRoom(room);
      setPassword('');
      setShowPasswordModal(true);
    } else {
      onJoinRoom(room.id);
    }
  };

  const handlePasswordSubmit = () => {
    if (selectedRoom) {
      onJoinRoom(selectedRoom.id, password);
      setShowPasswordModal(false);
      setSelectedRoom(null);
      setPassword('');
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return '今';
    if (minutes < 60) return `${minutes}分前`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}時間前`;

    const days = Math.floor(hours / 24);
    return `${days}日前`;
  };

  if (loading || externalLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">ルーム一覧を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">
          <div className="text-lg font-semibold mb-2">エラー</div>
          <div className="text-sm">{error}</div>
        </div>
        <button
          onClick={refreshRooms}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          再試行
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">ルーム一覧</h2>
          <p className="text-gray-600">
            {rooms.length}個のルームが利用可能
            {!connected && (
              <span className="text-red-600 ml-2">（接続中...）</span>
            )}
          </p>
        </div>
        <button
          onClick={onCreateRoom}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-semibold"
        >
          + ルーム作成
        </button>
      </div>

      {/* フィルター */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 検索 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ルーム名で検索
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ルーム名を入力..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* プレイヤー数フィルター */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              最大プレイヤー数
            </label>
            <select
              value={maxPlayersFilter || ''}
              onChange={(e) =>
                setMaxPlayersFilter(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">すべて</option>
              <option value="4">4人</option>
              <option value="5">5人</option>
            </select>
          </div>

          {/* プライベートルーム表示 */}
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showPrivateRooms}
                onChange={(e) => setShowPrivateRooms(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">
                プライベートルームを表示
              </span>
            </label>
          </div>

          {/* 更新ボタン */}
          <div className="flex items-end">
            <button
              onClick={refreshRooms}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              更新
            </button>
          </div>
        </div>
      </div>

      {/* ルーム一覧 */}
      <div className="space-y-3">
        {filteredRooms.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <div className="text-gray-500">
              <div className="text-lg font-semibold mb-2">
                利用可能なルームがありません
              </div>
              <div className="text-sm">
                新しいルームを作成してゲームを始めましょう！
              </div>
            </div>
          </div>
        ) : (
          filteredRooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {room.name}
                    </h3>
                    {room.isPrivate && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        🔒 プライベート
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <span>
                      👥 {room.currentPlayers} / {room.maxPlayers}人
                    </span>
                    <span>🕒 {formatTimeAgo(room.createdAt)}</span>
                    <span>
                      👑{' '}
                      {Object.values(room.players).find(
                        (p) => p.id === room.createdBy
                      )?.name || '不明'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleJoinRoom(room)}
                  disabled={room.currentPlayers >= room.maxPlayers}
                  className={`px-6 py-2 rounded-md font-semibold transition-colors ${
                    room.currentPlayers >= room.maxPlayers
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {room.currentPlayers >= room.maxPlayers ? '満員' : '参加'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* パスワード入力モーダル */}
      {showPasswordModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">パスワードを入力</h3>
            <p className="text-gray-600 mb-4">
              「{selectedRoom.name}」に参加するにはパスワードが必要です。
            </p>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            />

            <div className="flex space-x-3">
              <button
                onClick={handlePasswordSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                参加
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedRoom(null);
                  setPassword('');
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
