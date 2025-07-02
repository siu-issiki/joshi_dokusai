'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRoom } from '@/hooks/useRooms';
import { useAuth, usePlayerName } from '@/lib/auth';
import { FirebaseRoomPlayer } from '@/types/firebase';

interface JoinRoomModalProps {
  isOpen: boolean;
  onJoin: (playerName: string, password?: string) => Promise<void>;
  onCancel: () => void;
  isPrivate: boolean;
}

function JoinRoomModal({
  isOpen,
  onJoin,
  onCancel,
  isPrivate,
}: JoinRoomModalProps) {
  const [playerName, setPlayerName] = useState('');
  const [password, setPassword] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsJoining(true);

    try {
      await onJoin(playerName, password);
    } catch (error) {
      const message = error instanceof Error ? error.message : '不明なエラー';
      setError(message);
    } finally {
      setIsJoining(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">ルームに参加</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              プレイヤー名
            </label>
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

          {isPrivate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="パスワードを入力"
                required
              />
            </div>
          )}

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              disabled={isJoining}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isJoining}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isJoining ? '参加中...' : '参加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface PlayerCardProps {
  player: FirebaseRoomPlayer;
  isOwner: boolean;
  isCurrentUser: boolean;
}

function PlayerCard({ player, isOwner, isCurrentUser }: PlayerCardProps) {
  return (
    <div
      className={`bg-white rounded-lg p-4 border-2 ${
        isCurrentUser ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`w-4 h-4 rounded-full ${
              player.isReady ? 'bg-green-500' : 'bg-gray-300'
            }`}
          />
          <div>
            <h3 className="font-medium text-gray-800">
              {player.name}
              {isOwner && (
                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  ホスト
                </span>
              )}
              {isCurrentUser && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  あなた
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-600">
              {new Date(player.joinedAt).toLocaleTimeString()} に参加
            </p>
          </div>
        </div>
        <div className="text-right">
          <span
            className={`text-sm font-medium ${
              player.isReady ? 'text-green-600' : 'text-gray-500'
            }`}
          >
            {player.isReady ? '準備完了' : '準備中'}
          </span>
        </div>
      </div>
    </div>
  );
}

function RoomPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = searchParams.get('id') || '';
  const { user, loading: authLoading, autoSignIn } = useAuth();
  const { updatePlayerName } = usePlayerName();
  const {
    room,
    loading,
    error,
    joinRoom,
    leaveRoom,
    toggleReady,
    isInRoom,
    isRoomOwner,
    canStartGame,
  } = useRoom(roomId);

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // 認証チェック
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">認証に失敗しました</p>
          <button
            onClick={autoSignIn}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  // ルームが見つからない場合
  if (!loading && !room) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            ルームが見つかりません
          </h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  const handleJoinRoom = async (playerName: string, password?: string) => {
    await joinRoom(playerName, password);
    updatePlayerName(playerName);
    setShowJoinModal(false);
  };

  const handleLeaveRoom = async () => {
    setActionLoading(true);
    try {
      await leaveRoom();
      router.push('/');
    } catch (error) {
      console.error('ルーム退出エラー:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleReady = async () => {
    setActionLoading(true);
    try {
      await toggleReady();
    } catch (error) {
      console.error('準備状態変更エラー:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartGame = async () => {
    // TODO: Phase 2で実装
    console.log('ゲーム開始（未実装）');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* ヘッダー */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                {room.name}
                {room.isPrivate && (
                  <span className="ml-2 text-yellow-600">🔒</span>
                )}
              </h1>
              <p className="text-gray-600">
                {room.currentPlayers}/{room.maxPlayers}人 • 作成者:{' '}
                {room.players[room.createdBy]?.name || '不明'}
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              ← ルーム一覧に戻る
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* プレイヤー一覧 */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              プレイヤー
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {Object.values(room.players).map((player: FirebaseRoomPlayer) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  isOwner={player.id === room.createdBy}
                  isCurrentUser={player.id === user?.uid}
                />
              ))}
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex justify-center space-x-4">
            {!isInRoom ? (
              <button
                onClick={() => setShowJoinModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                ルームに参加
              </button>
            ) : (
              <>
                <button
                  onClick={handleToggleReady}
                  disabled={actionLoading}
                  className={`px-6 py-3 rounded-md transition-colors ${
                    room.players[user?.uid || '']?.isReady
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {actionLoading
                    ? '変更中...'
                    : room.players[user?.uid || '']?.isReady
                      ? '準備解除'
                      : '準備完了'}
                </button>

                {isRoomOwner && canStartGame && (
                  <button
                    onClick={handleStartGame}
                    className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  >
                    ゲーム開始
                  </button>
                )}

                <button
                  onClick={handleLeaveRoom}
                  disabled={actionLoading}
                  className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  {actionLoading ? '退出中...' : 'ルーム退出'}
                </button>
              </>
            )}
          </div>

          {/* ゲーム開始条件の表示 */}
          {isInRoom && isRoomOwner && !canStartGame && (
            <div className="mt-4 text-center text-gray-600">
              <p>全プレイヤーが準備完了するとゲームを開始できます</p>
            </div>
          )}
        </div>
      </div>

      <JoinRoomModal
        isOpen={showJoinModal}
        onJoin={handleJoinRoom}
        onCancel={() => setShowJoinModal(false)}
        isPrivate={room.isPrivate}
      />
    </div>
  );
}

export default function RoomPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">読み込み中...</div>}>
      <RoomPageContent />
    </Suspense>
  );
}
