'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FirebaseRoom, FirebaseRoomPlayer } from '@joshi-dokusai/shared';
import { useRooms } from '@/hooks/useRooms';

interface RoomCardProps {
  room: FirebaseRoom;
  onJoin: (_roomId: string) => void;
}

function RoomCard({ room, onJoin }: RoomCardProps) {
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = () => {
    setIsJoining(true);
    try {
      onJoin(room.id);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">{room.name}</h3>
          <p className="text-sm text-gray-600">作成者: {room.createdByName || room.players[room.createdBy]?.name || '不明'}</p>
        </div>
        {room.isPrivate && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            🔒 プライベート
          </span>
        )}
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            👥 {room.currentPlayers}/{room.maxPlayers}人
          </span>
          <span className="text-sm text-gray-600">⏰ {new Date(room.createdAt).toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          {Object.values(room.players).map((player: FirebaseRoomPlayer) => (
            <div key={player.id} className="w-3 h-3 rounded-full bg-blue-500" title={player.name} />
          ))}
        </div>

        <button
          onClick={handleJoin}
          disabled={isJoining || room.currentPlayers >= room.maxPlayers}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            room.currentPlayers >= room.maxPlayers
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isJoining ? '参加中...' : room.currentPlayers >= room.maxPlayers ? '満員' : '参加'}
        </button>
      </div>
    </div>
  );
}

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (_name: string, _maxPlayers: number, _isPrivate: boolean, _playerName: string, _password?: string) => Promise<void>;
}

function CreateRoomModal({ isOpen, onClose, onCreateRoom }: CreateRoomModalProps) {
  const [roomName, setRoomName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(5);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // プレイヤー名の初期値設定
  useEffect(() => {
    if (isOpen) {
      const savedName = localStorage.getItem('playerName');
      if (savedName) {
        setPlayerName(savedName);
      }
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsCreating(true);

    try {
      await onCreateRoom(roomName, maxPlayers, isPrivate, playerName, password);
      // 成功時はモーダルを閉じる
      setRoomName('');
      setPlayerName('');
      setPassword('');
      setIsPrivate(false);
      setMaxPlayers(5);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : '不明なエラー';
      setError(message);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">新しいルームを作成</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ルーム名</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ルーム名を入力"
              required
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">あなたの名前</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="プレイヤー名を入力"
              required
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">最大プレイヤー数</label>
            <select
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={4}>4人</option>
              <option value={5}>5人</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPrivate"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-700">
              プライベートルーム
            </label>
          </div>

          {isPrivate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="パスワードを入力"
                required={isPrivate}
                maxLength={20}
              />
            </div>
          )}

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              disabled={isCreating}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isCreating ? '作成中...' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RoomList() {
  const { rooms, loading, error, createRoom } = useRooms();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const router = useRouter();

  const handleJoinRoom = (roomId: string) => {
    router.push(`/room?id=${roomId}`);
  };

  const handleCreateRoom = async (name: string, maxPlayers: number, isPrivate: boolean, playerName: string, password?: string) => {
    const roomId = await createRoom(name, maxPlayers, isPrivate, playerName, password);
    router.push(`/room?id=${roomId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">ルーム一覧</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          + ルーム作成
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

      {rooms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">利用可能なルームがありません</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            最初のルームを作成
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} onJoin={handleJoinRoom} />
          ))}
        </div>
      )}

      <CreateRoomModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreateRoom={handleCreateRoom} />
    </div>
  );
}
